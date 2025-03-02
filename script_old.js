const minesContainer = document.querySelector('.mines-container')
const minesCounter = document.querySelector('.mines-counter')
const mines = []
const rows = 10;
const cols = 16;
const minesCount = rows * cols * 0.2;
let gameState = 'playing'

const ws = new WebSocket('ws://localhost:3000')

function setUUID() {
    const uuid = localStorage.getItem('uuid')
    if (uuid) return
    const newUUID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
    localStorage.setItem('uuid', newUUID)
}

function createTiles() {
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div')
        row.classList.add('row')
        minesContainer.appendChild(row)
        for (let j = 0; j < cols; j++) {
            const mine = document.createElement('div')
            mine.classList.add('tile')
            
            mine.onclick = () => {
                checkTile(i, j)
            }

            mine.oncontextmenu = (e) => {
                e.preventDefault()
                if (gameState == 'lost' || gameState == "won") return location.reload();
                const mineInfo = mines.find(m => m.x == i && m.y == j)
                if (mineInfo.checked) return false
                mineInfo.flagged = !mineInfo.flagged
                mine.classList.toggle('flagged')

                const flaggedMines = mines.filter(m => m.flagged)
                minesCounter.innerText = minesCount - flaggedMines.length
            }

            row.appendChild(mine)
            mines.push({ x: i, y: j, isMine: false, checked: false, flagged: false, el: mine })
        }
    }
}

function placeMines() {
    for (let i = 0; i < minesCount; i++) {
        const mine = mines[Math.floor(Math.random() * mines.length)]
        if (mine.isMine) {
            i--
            continue
        }
        mine.isMine = true
    }
}

function checkTile(x, y) {
    if (gameState == 'lost' || gameState == "won") return location.reload();
    const mineInfo = mines.find(m => m.x == x && m.y == y)
    if (mineInfo.flagged) return
    const mine = mineInfo.el
    mine.classList.add('checked')
    
    if (mineInfo.isMine) {
        gameState = 'lost'
        mine.classList.add('redmine')
        mines.forEach(mine => {
            if (mine.isMine) {
                mine.el.classList.add('mine')
            }
        })
        return;
    }

    if (mineInfo.checked) {
        return;
    }

    mineInfo.checked = true

    let t_minesCount = 0;

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i < 0 || i >= rows || j < 0 || j >= cols) {
                continue;
            }
            const mine = mines.find(m => m.x == i && m.y == j)
            if (mine.isMine) {
                t_minesCount++
            }
        }
    }

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

    if (mines.filter(m => m.checked).length == rows * cols - minesCount) {
        console.log('won')
        gameState = 'won'
        mines.forEach(mine => {
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


setUUID()
createTiles()
placeMines()
minesCounter.innerText = minesCount