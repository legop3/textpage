import express from 'express'
import fs from 'fs'
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = './data/text.json';
let sharedDelta = { ops: [] };


export async function start(){
    if (fs.existsSync(DATA_FILE)) {
        try {
            sharedDelta = JSON.parse(fs.readFileSync(DATA_FILE));
        } catch (err) {
            console.error('Failed to load delta:', err);
        }
    }

    app.use(express.static('public'));

    io.on('connection', (socket) => {
        socket.emit('init', sharedDelta);

        socket.on('update', (delta) => {
            sharedDelta = delta;
            fs.writeFileSync(DATA_FILE, JSON.stringify(sharedDelta));
            socket.broadcast.emit('update', sharedDelta);
        });
    });

    //TODO attach 'Config.http.ip' to the listener;
    server.listen(Config.http.port, () => {
        console.log(`server running on http://${Config.http.ip}:${Config.http.port}`);
    });
}