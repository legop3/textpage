

let sessionIDCounter = 0;
let Database;
let State;

export async function start(state){
    Database = state.database;
    State = state;

    state.io.on('connection', onSocketConnect);
}

async function onSocketConnect(socket) {
    const sessionid = sessionIDCounter++;
    let clientSlug = `nobody@socket${sessionid}`;

    console.log(`${clientSlug}: connected`);

    let cookie = await new Promise((ok,err)=> {
        socket.emit('getCookie',ok);
    });

    console.log(`${clientSlug}: got cookie: ${cookie}`);




    socket.on('deltaUpdateSend', (delta) => {
        console.log(`delta recieved, ${JSON.stringify(delta)}`)
        socket.broadcast.emit('deltaUpdate', delta)
    });

    socket.on('disconnect',()=>{
        console.log(`${clientSlug}: disconnected`)
    })
}