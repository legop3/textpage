import express from 'express'
import fs from 'fs'
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = './data/fulldoc.json';
const DELTA_FILE = './data/deltas.json'
let fulldoc = { ops: [] };




export async function start(){
    if (fs.existsSync(DATA_FILE)) {
        try {
            fulldoc = JSON.parse(fs.readFileSync(DATA_FILE));
        } catch (err) {
            console.error('Failed to load fulldoc:', err);
        }
    }

    app.use(express.static('public'));

    io.on('connection', (socket) => {
        console.log(`client connected! sending fulldoc`)
        socket.emit('init', fulldoc);

        socket.on('deltaUpdateSend', (delta) => {
            console.log(`delta recieved, ${JSON.stringify(delta)}`)
            socket.broadcast.emit('deltaUpdate', delta)
        });
    });

    // io.on('deltaUpdate', (delta) => {
    //     console.log(`delta recieved! ${delta}`)
    //     io.emit('deltaUpdate', delta)
    // })

    //TODO attach 'Config.http.ip' to the listener;
    server.listen(Config.http.port, () => {
        console.log(`server running on http://${Config.http.ip}:${Config.http.port}`);
    });
}