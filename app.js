const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const lobbies = []

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    ws.on('message', (message) => {
        console.log(`Mensaje recibido: ${message}`);
        ws.send(`Echo: ${message}`);
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

app.get('/lobby/:id', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/tiles/:id', (req, res) => {
    const lobby = lobbies.find(l => l.id == req.params.id)
    res.json(lobby)
});

app.get('/create', (req, res) => {
    res.sendFile(__dirname + '/lobby.html');
});

app.post('/create', (req, res) => {

    const { rows, cols, ownerId } = req.body

    const lobby = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        players: [ownerId],
        state: 'waiting',
        rows: rows,
        cols: cols,
        tiles: createTiles(rows, cols)
    }


    lobbies.push(lobby)
    res.redirect(`/lobby/${lobby.id}`)
});

app.get("/info", (req, res) => {
    res.json(lobbies)
});

server.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});



function createTiles(rows, cols) {
    const tiles = []
    const minesCount = Math.floor((rows * cols) * 0.2)
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            tiles.push({ x: i, y: j, isMine: false, checked: false, flagged: false })
        }
    }
    placeMines(tiles, minesCount)
    return tiles
}

function placeMines(tiles, minesCount) {
    for (let i = 0; i < minesCount; i++) {
        const mine = tiles[Math.floor(Math.random() * tiles.length)]
        if (mine.isMine) {
            i--
            continue
        }
        mine.isMine = true
    }
}