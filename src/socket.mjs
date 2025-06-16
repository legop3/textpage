import fs from 'fs'

let sessionIDCounter = 0;
let Database;
let State;

const DATA_FILE = './data/fulldoc.json';



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

    let cookie = await new Promise((ok,err)=> {
        socket.emit('getCookie',ok);
    });

    console.log(`${clientSlug}: got cookie: ${cookie}`);


    socket.broadcast.emit('request-fulldoc')

    socket.on('fulldoc-fullfill', (fulldoc) => {
        console.log(`fulldoc, recieved`)
    })

    socket.on('deltaUpdateSend', (delta) => {
        console.log(`delta recieved, ${JSON.stringify(delta)}`)
        socket.broadcast.emit('deltaUpdate', delta)
    });

    socket.on('disconnect',()=>{
        console.log(`${clientSlug}: disconnected`)
    })
}