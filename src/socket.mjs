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

    console.log(`${clientSlug}: connected`);

    socket.on('disconnect',()=>{
        console.log(`${clientSlug}: disconnected`)
    })

    // --- sequenced below this line

    let cookie = await new Promise((ok,err)=> {
        socket.emit('getCookie',ok);
    });

    console.log(`${clientSlug}: got cookie: ${cookie}`);

    // --- register commands below this line


    socket.broadcast.emit('request-fulldoc')


}