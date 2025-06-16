import fs from 'fs'

let sessionIDCounter = 0;
let Database;
let State;

const DATA_FILE = './data/fulldoc.json';

// we are storing this as both the document and deltas then added onto it;

const openPages = new Map();

async function getPage(id){
    let page = openPages.get(id);
    if(!page){
        console.log(`page(${id}): pull`);
        page = await Database.getSingle('select id,title,document from Pages where id = ?',id || 0); //TODO encode and decode document field
        if(!page) return null;

        page.newDeltas = [];

        let deltas = await Database.getAllWierd('select contents from PageDeltas where pageid = ? ',id || 0);//TODO sortby index

        page.deltas = [].concat(...deltas.map(m=>JSON.parse(m.contents)));

        openPages.set(id,page);
    }

    return page;
}


async function flushAllPages(){
    console.log("status: flush all pages")
    for(const page of openPages.values()){
        await flushPage(page);
    }
}

async function flushPage(page){
    try {
        if (page.newDeltas.length > 0){
            console.log(`page(${page.id}): flushing to database`);
            let dstr = JSON.stringify(page.newDeltas);
            await Database.getSingle('INSERT into PageDeltas(pageid,contents) values(?,?)',page.id,dstr);
            page.newDeltas = [];
        } else {
            console.log(`page(${page.id}): no need to flush`);
        }
    } catch (e) {
        console.error("cannot flush page, dumping what would be written data")
        console.error(dstr);
    }
}

async function shutdown(){
    console.log(`status: shutting down`);
    await flushAllPages();

    console.log(`status: goodbye`);
    process.exit()
}

setInterval(flushAllPages,10000);


process.on('uncaughtException',async (err)=>{
    console.error(err);
    console.log('signal: EXCEPTION')
    await shutdown();
})

process.on('SIGINT',async ()=>{
    console.log('signal: SIGINT')
    await shutdown();
})

process.on('exit',async ()=>{

})

export async function start(state){
    Database = state.database;
    State = state;

    state.io.on('connection', onSocketConnect);

    // if fulldoc file exists, parse and load it
    if (fs.existsSync(DATA_FILE)) {
        try {
            fulldoc = JSON.parse(fs.readFileSync(DATA_FILE));
        } catch (err) {
            console.error('Failed to load fulldoc:', err);
        }
    }

}

async function onSocketConnect(socket) {
    const sessionid = sessionIDCounter++;
    let clientSlug = `notready@socket${sessionid}`;
    let userid = null //Config.users.default_user_id;

    console.log(`${clientSlug}: connected`);

    socket.on('disconnect',()=>{
        console.log(`${clientSlug}: disconnected`)
    })

    // --- sequenced login process below this line//id:userid,

    console.log(`${clientSlug}: getting page number`)
    let pageId = await new Promise((ok,err)=> {
        socket.emit('getYourPage',ok);
    });

    pageId = parseInt(pageId) || 0;
    console.log(`${clientSlug}: selected page ${pageId}`);
    let page = await getPage(pageId);

    if(!page) {
        console.log(`${clientSlug}: page does not exist, stalling session`)
        socket.emit('cannotConnect',`page does not exist`);
        return;
    }



    while (userid === null){
        let cookie = await new Promise((ok,err)=> {
            socket.emit('getCookie',ok);
        });

        cookie = String(cookie);

        console.log(`${clientSlug}: got cookie: ${cookie}`);

        let cookieUid = await Database.getSingle('SELECT userid from cookies where cookie = ? limit 1',cookie);
        let _userid;
        if(cookieUid){
            _userid = cookieUid.userid;
        } else {

        }

        if (_userid) {
            console.log(`${clientSlug}: cookie was valid`);
            userid = _userid;
            continue;
        }

        console.log("cookie is not registered, logging in as default_user");
        await Database.getSingle('INSERT into cookies(cookie,userid) values(?,?)',cookie,Config.users.default_user_id);



    }

    let loginData
    while (true){
        loginData = await Database.getSingle('SELECT displayName,handle,bio from Users where id = ? limit 1',userid);
        if(!loginData){

            // we REALLY should not be recovering from this error, but oh well
            console.error(`client "${clientSlug}" was able to connect to non-existant user (id ${userid})! forcing them to login as default_user`);
            userid = Config.users.default_user_id;
            continue;
        };
        break;
    }


    let {displayName,handle,bio} = loginData;
    clientSlug = `${handle}@socket${sessionid}`;
    console.log(`${clientSlug}: logged in: ${displayName}`);

    // --- register commands below this line


    // commands go here...

    socket.on('deltaUpdateSend', (delta) => {
        console.log(`${clientSlug}: delta recieved: ${JSON.stringify(delta)}`)
        page.deltas.push(delta);
        page.newDeltas.push(delta);
        socket.broadcast.emit('deltaUpdate', delta)
    });

    // --- register commands above this line

    // logged in as either their account or anonimous
    // can make database changes now
    socket.emit('logged_in',{
        //id:userid,
        displayName,handle,bio
    });

    console.log(`${clientSlug}: logged in signal sent`);

    await new Promise((ok,err)=> {
        socket.emit('replaceDocument',{
            document:page.document,
            deltas:page.deltas,
        },ok);
    });

    console.log(`${clientSlug}: ready to edit`);
}