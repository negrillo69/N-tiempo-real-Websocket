// server.js
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let tasks = [];
let users = {}; // Objeto para almacenar usuarios conectados, ej: { socketId: userId }

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'NEW_USER':
        users[ws] = data.userId;
        broadcast({ type: 'UPDATE_USERS', users: Object.values(users) });
        break;

      case 'ADD_TASK':
        tasks.push(data.task);
        broadcast({ type: 'ADD_TASK', task: data.task });
        break;

      case 'UPDATE_TASK':
        tasks = tasks.map((task) => (task.id === data.task.id ? data.task : task));
        broadcast({ type: 'UPDATE_TASK', task: data.task });
        break;

      case 'DELETE_TASK':
        tasks = tasks.filter((task) => task.id !== data.id);
        broadcast({ type: 'DELETE_TASK', id: data.id });
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    delete users[ws];
    broadcast({ type: 'UPDATE_USERS', users: Object.values(users) });
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket en el puerto ${PORT}`);
});
