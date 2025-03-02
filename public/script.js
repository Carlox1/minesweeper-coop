const minesContainer = document.querySelector('.mines-container')
const minesCounter = document.querySelector('.mines-counter')
let lobby = {};
let tiles = []
let rows = 0;
let cols = 0;
let minesCount = rows * cols * 0.2;
let gameState = 'playing'
let ws = null
const playerId = setUUID()

console.log("a")

fetch('/tiles/' + window.location.pathname.split('/')[2],).then(data => data.json()).then(data => {

    lobby = data
    tiles = lobby.tiles
    rows = lobby.rows
    cols = lobby.cols
    minesCount = tiles.filter(m => m.isMine).length
    minesCounter.innerText = minesCount

    ws = new WebSocket('/ws?' + "playerId=" + playerId + "&lobbyId=" + lobby.id)

    ws.onmessage = (message) => {
        const [action, x, y] = message.data.split(':')
        if (action == 'click') {
            checkTile(parseInt(x), parseInt(y))
        }

        if (action == 'flag') {
            flagTile(parseInt(x), parseInt(y))
        }
    }

    createTiles()
})

function setUUID() {
    const uuid = localStorage.getItem('uuid')
    if (uuid) return uuid
    const newUUID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
    localStorage.setItem('uuid', newUUID)
    return newUUID
}

function nearMines(x, y) {
    let minesCount = 0;

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i < 0 || i >= rows || j < 0 || j >= cols) {
                continue;
            }
            const mine = tiles.find(m => m.x == i && m.y == j)
            if (mine.isMine) {
                minesCount++
            }
        }
    }

    return minesCount
}

function createTiles() {
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div')
        row.classList.add('row')
        minesContainer.appendChild(row)
        for (let j = 0; j < cols; j++) {
            const tile = document.createElement('div')
            tile.classList.add('tile')

            tile.onclick = () => {
                if (gameState == 'lost' || gameState == "won") return resetGame();
                checkTile(i, j)
                ws.send('click:' + i + ':' + j)
            }

            tile.oncontextmenu = (e) => {
                e.preventDefault()
                if (gameState == 'lost' || gameState == "won") return resetGame();
                flagTile(i, j)
                ws.send('flag:' + i + ':' + j)
            }

            row.appendChild(tile)
            const t_tile = tiles.find(m => m.x == i && m.y == j)
            t_tile.el = tile

            if (t_tile.checked) tile.classList.add('checked')
            if (t_tile.flagged) tile.classList.add('flagged')

            const t_minesCount = nearMines(i, j)

            if (t_tile.checked && t_minesCount > 0) {
                if (t_minesCount == 1) {
                    tile.classList.add('one')
                } else if (t_minesCount == 2) {
                    tile.classList.add('two')
                } else if (t_minesCount == 3) {
                    tile.classList.add('three')
                } else if (t_minesCount == 4) {
                    tile.classList.add('four')
                } else if (t_minesCount == 5) {
                    tile.classList.add('five')
                } else if (t_minesCount == 6) {
                    tile.classList.add('six')
                } else if (t_minesCount == 7) {
                    tile.classList.add('seven')
                } else if (t_minesCount == 8) {
                    tile.classList.add('eight')
                }
            }

        }
    }
}

function checkTile(x, y) {
    if (gameState == 'lost' || gameState == "won") return resetGame();
    const tileInfo = tiles.find(m => m.x == x && m.y == y)
    if (tileInfo.flagged) return
    const mine = tileInfo.el
    mine.classList.add('checked')

    if (tileInfo.isMine) {
        gameState = 'lost'
        mine.classList.add('redmine')
        tiles.forEach(mine => {
            if (mine.isMine) {
                mine.el.classList.add('mine')
            }
        })
        return;
    }

    if (tileInfo.checked) {
        return;
    }

    tileInfo.checked = true

    const t_minesCount = nearMines(x, y)

    if (t_minesCount > 0) {
        if (t_minesCount == 1) {
            mine.classList.add('one')
        } else if (t_minesCount == 2) {
            mine.classList.add('two')
        } else if (t_minesCount == 3) {
            mine.classList.add('three')
        } else if (t_minesCount == 4) {
            mine.classList.add('four')
        } else if (t_minesCount == 5) {
            mine.classList.add('five')
        } else if (t_minesCount == 6) {
            mine.classList.add('six')
        } else if (t_minesCount == 7) {
            mine.classList.add('seven')
        } else if (t_minesCount == 8) {
            mine.classList.add('eight')
        }
    }

    if (tiles.filter(m => m.checked).length == rows * cols - minesCount) {
        console.log('won')
        gameState = 'won'
        tiles.forEach(mine => {
            if (mine.isMine && !mine.flagged) {
                mine.el.classList.add('mine')
            }
        })
        return;
    }

    if (t_minesCount > 0) return

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i < 0 || i >= rows || j < 0 || j >= cols) {
                continue;
            }
            checkTile(i, j)
        }
    }
}

function flagTile(x, y) {
    if (gameState == 'lost' || gameState == "won") return resetGame();
    const tileInfo = tiles.find(m => m.x == x && m.y == y)
    if (tileInfo.checked) return false
    tileInfo.flagged = !tileInfo.flagged
    tileInfo.el.classList.toggle('flagged')

    const flaggedMines = tiles.filter(m => m.flagged)
    minesCounter.innerText = minesCount - flaggedMines.length
}

function resetGame() {
    ws.send('reset:0:0')
    location.reload()
}