import express from 'express'
import fs from 'fs'
import http from 'http';
import { Server } from 'socket.io';
import { start as start_socket } from './socket.mjs'

export const state = {};

state.app = express();
state.server = http.createServer(state.app);
state.io = new Server(state.server);

const DATA_FILE = './data/fulldoc.json';
const DELTA_FILE = './data/deltas.json'
let fulldoc = { ops: [] };

let Database;

export async function start(__database){
    state.database = __database;

    // if (fs.existsSync(DATA_FILE)) {
    //     try {
    //         fulldoc = JSON.parse(fs.readFileSync(DATA_FILE));
    //     } catch (err) {
    //         console.error('Failed to load fulldoc:', err);
    //     }
    // }

    await start_socket(state);

    state.app.use(express.static('public'));

    //TODO attach 'Config.http.ip' to the listener;
    state.server.listen(Config.http.port, () => {
        console.log(`server running on http://${Config.http.ip}:${Config.http.port}`);
    });
}