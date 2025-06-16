import fs from 'fs'

let sessionIDCounter = 0;
let Database;
let State;

const DATA_FILE = './data/fulldoc.json';
let fulldoc


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
    let clientSlug = `nobody@socket${sessionid}`;
    let userid = null;

    console.log(`${clientSlug}: connected`);

    socket.on('disconnect',()=>{
        console.log(`${clientSlug}: disconnected`)
    })

    // --- sequenced login process below this line


    while (userid === null){
        let cookie = await new Promise((ok,err)=> {
            socket.emit('getCookie',ok);
        });

        cookie = String(cookie);

        console.log(`${clientSlug}: got cookie: ${cookie}`);

        let {userid:_userid} = await Database.getSingle('SELECT userid from cookies where cookie = ? limit 1',cookie)

        if (_userid) {
            clientSlug =
            console.log(`${clientSlug}: cookie was valid`);
            userid = _userid;
            continue;
        }

        //TODO create/connect account to cookie
        console.log("cookie is not coonnected to account, mindlessly trying again");

    }

    let {displayName,handle,bio} = await Database.getSingle('SELECT displayName,handle,bio from Users where id = ? limit 1',id);

    await new Promise((ok,err)=> {
        socket.emit('logged_in',ok,{
            //id:userid,
            displayName,handle,bio
        });
    });



    // --- register commands below this line

    // commands go here...

    socket.on('deltaUpdateSend', (delta) => {
        console.log(`${clientSlug}: delta recieved: ${JSON.stringify(delta)}`)
        socket.broadcast.emit('deltaUpdate', delta)
    });

    // --- register commands above this line
    socket.broadcast.emit('accepting_commands');

}