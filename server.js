const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => clients = clients.filter(c => c !== ws));
});

app.post('/submit', (req, res) => {
  const text = req.body.text;
  clients.forEach(c => c.send(JSON.stringify({ text })));
  res.redirect('/result.html');
});

app.listen(3000, () => console.log('Server läuft auf http://localhost:3000'));