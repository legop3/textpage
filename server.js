const express = require('express');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = './data/text.json';
let sharedDelta = { ops: [] };

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

server.listen(3250, () => {
  console.log('server running on http://localhost:3250');
});
