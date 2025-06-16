import fs from 'fs'

let sessionIDCounter = 0;
let Database;
let State;

const DATA_FILE = './data/fulldoc.json';

// we are storing this as both the document and deltas then added onto it;
let documentDeltas = [];
let document = {ops:[]};

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
        documentDeltas.push(delta);
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
            document:document,
            deltas:documentDeltas,
        },ok);
    });

    console.log(`${clientSlug}: ready to edit`);
}