const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
/**
 * @type {WebSocket.Server}
 */
const wss = new WebSocket.Server({ server });

const lobbies = []

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * @param {WebSocket} ws
 * @param {import('http').IncomingMessage} req
 */

wss.on('connection', (ws, req) => {
    const { playerId, lobbyId } = req.url.split('?')[1].split('&').reduce((acc, curr) => {
        const [key, value] = curr.split('=')
        acc[key] = value
        return acc
    }, {})

    ws.playerId = playerId
    ws.lobbyId = lobbyId

    ws.on('message', (message) => {
        message = message.toString()
        const [action, x, y] = message.split(':')

        if (action == "mouse") return

        if (action == "click" || action == "flag" || action == "mouse") {
            wss.clients.forEach(client => {
                if (client.lobbyId == ws.lobbyId && client.playerId != ws.playerId) {
                    client.send(message)
                }
            })
            if (action == "click") checkTile(lobbies.find(l => l.id == ws.lobbyId), parseInt(x), parseInt(y))
            if (action == "flag") {
                const lobby = lobbies.find(l => l.id == ws.lobbyId)
                const tile = lobby.tiles.find(t => t.x == parseInt(x) && t.y == parseInt(y))
                tile.flagged = !tile.flagged
            }
        }

        if (action == "reset") {
            const lobby = lobbies.find(l => l.id == ws.lobbyId)
            lobby.tiles = createTiles(lobby.rows, lobby.cols)
            wss.clients.forEach(client => {
                if (client.lobbyId == ws.lobbyId) {
                    client.send("reset")
                }
            })
        }
    })
});

app.get('/lobby/:id', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/tiles/:id', (req, res) => {
    const lobby = lobbies.find(l => l.id == req.params.id)
    res.json(lobby)
});

app.get("/", (req, res) => {
    res.redirect('/create')
})

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

server.listen(8752, () => {
    console.log('(:(');
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

function checkTile(lobby, x, y) {
    const tiles = lobby.tiles
    const rows = lobby.rows
    const cols = lobby.cols

    const tileInfo = tiles.find(m => m.x == x && m.y == y)
    if (tileInfo.flagged) return

    if (tileInfo.checked) return

    tileInfo.checked = true

    let t_minesCount = 0;

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i < 0 || i >= rows || j < 0 || j >= cols) {
                continue;
            }
            const mine = tiles.find(m => m.x == i && m.y == j)
            if (mine.isMine) {
                t_minesCount++
            }
        }
    }

    if (t_minesCount > 0) return

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i < 0 || i >= rows || j < 0 || j >= cols) {
                continue;
            }
            checkTile(lobby, i, j)
        }
    }
}