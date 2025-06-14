import express from 'express'
import fs from 'fs'
import http from 'http';
import { Server } from 'socket.io';
//trying new stuff -->
import * as Y from 'yjs';
// import {setupWSConnection} from 'y-websocket/bin/utils.js'

import WebSocket, { WebSocketServer } from 'ws';
// import { setupWSConnection } from 'y-websocket/bin/utils.js';


const app = express();
const server = http.createServer(app);
// const io = new Server(server);

// const DATA_FILE = './data/text.json';
// let sharedDelta = { ops: [] };
const ydoc = new Y.Doc()
const yLines = ydoc.getArray('lines')


export async function start(){

    console.log('setting up ws server')
    const wss = new WebSocketServer({server})




    //sync with websockets and yjs
    wss.on('connection', async (ws) => {
        console.log('user connected ws', ws.readyState)

        // send entire document on connection
        ws.send(Y.encodeStateAsUpdate(ydoc))

        // send updates as they are sent from clients
        ws.on('message', (msg) => {
            const update = new Uint8Array(msg)
            Y.applyUpdate(ydoc, update)

            for (const client of wss.clients) {
                if (client !== ws && client.readyState == WebSocket.OPEN) {
                    client.send(update)
                }
            }
        })
    })

    



    console.log('starting web server, supposedly')



    // if (fs.existsSync(DATA_FILE)) {
    //     try {
    //         sharedDelta = JSON.parse(fs.readFileSync(DATA_FILE));
    //     } catch (err) {
    //         console.error('Failed to load delta:', err);
    //     }
    // }

    app.use(express.static('public'));

    // io.on('connection', (socket) => {
    //     socket.emit('init', sharedDelta);

    //     socket.on('update', (delta) => {
    //         sharedDelta = delta;
    //         fs.writeFileSync(DATA_FILE, JSON.stringify(sharedDelta));
    //         socket.broadcast.emit('update', sharedDelta);
    //     });
    // });

    //TODO attach 'Config.http.ip' to the listener;
    server.listen(Config.http.port, () => {
        console.log(`server running on http://${Config.http.ip}:${Config.http.port}`);
    });



}