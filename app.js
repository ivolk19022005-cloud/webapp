// ============ ИНИЦИАЛИЗАЦИЯ ============
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Данные пользователя
const user = tg.initDataUnsafe?.user || {};

// Состояние
let currentTab = 'games';
let userBalance = user?.coins || 0;
let userLevel = user?.level || 1;

// Сапёр
let msBoard = [];
let msSize = 8;
let msMinesCount = 10;
let msBet = 100;
let msFlagsPlaced = 0;
let msRevealed = 0;
let msGameOver = false;

// ============ ЗАГРУЗКА ============
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем данные пользователя
    loadUserData();

    // Вкладки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Карточки игр
    document.querySelectorAll('.game-card[data-game]').forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.game === 'minesweeper') openMinesweeper();
        });
    });

    // Сложность Сапёра
    document.querySelectorAll('.ms-difficulty button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ms-difficulty button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            msSize = parseInt(btn.dataset.size);
            msMinesCount = parseInt(btn.dataset.mines);
            document.getElementById('msMines').textContent = msMinesCount;
            startMinesweeper();
        });
    });

    // Главная кнопка
    tg.MainButton.setText('Закрыть');
    tg.MainButton.onClick(() => tg.close());
    tg.MainButton.show();
});

// ============ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ============
function loadUserData() {
    tg.sendData(JSON.stringify({ action: 'get_profile' }));
    updateDisplay();
}

function updateDisplay() {
    document.getElementById('coinsDisplay').textContent = `💰 ${formatNumber(userBalance)} 🪙 | 🎯 Ур. ${userLevel}`;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'М';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'К';
    return String(num);
}

// ============ ВКЛАДКИ ============
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    currentTab = tab;
}

// ============ ОТПРАВКА ДЕЙСТВИЙ ============
function sendAction(action, extraData = {}) {
    tg.sendData(JSON.stringify({
        action: action,
        ...extraData
    }));
    tg.close();
}

// ============ САПЁР ============
function openMinesweeper() {
    document.getElementById('gameGrid').style.display = 'none';
    document.getElementById('minesweeperScreen').style.display = 'block';
    startMinesweeper();
}

function closeMinesweeper() {
    document.getElementById('gameGrid').style.display = 'grid';
    document.getElementById('minesweeperScreen').style.display = 'none';
}

function setMinesweeperBet() {
    const input = document.getElementById('msBet');
    let bet = parseInt(input.value);
    if (isNaN(bet) || bet < 10) bet = 10;
    msBet = bet;
    input.value = msBet;
    startMinesweeper();
}

function startMinesweeper() {
    msGameOver = false;
    msFlagsPlaced = 0;
    msRevealed = 0;
    msBoard = [];

    document.getElementById('msGameOver').innerHTML = '';
    document.getElementById('msNewGame').style.display = 'none';
    document.getElementById('msFlags').textContent = '0';
    document.getElementById('msMines').textContent = msMinesCount;

    const totalCells = msSize * msSize;
    const minePositions = new Set();
    
    while (minePositions.size < msMinesCount) {
        minePositions.add(Math.floor(Math.random() * totalCells));
    }

    for (let i = 0; i < totalCells; i++) {
        msBoard.push({
            mine: minePositions.has(i),
            revealed: false,
            flagged: false,
            adjacentMines: 0
        });
    }

    // Считаем соседей
    for (let i = 0; i < totalCells; i++) {
        if (msBoard[i].mine) continue;
        const neighbors = getNeighbors(i);
        msBoard[i].adjacentMines = neighbors.filter(n => msBoard[n].mine).length;
    }

    renderBoard();
}

function getNeighbors(index) {
    const row = Math.floor(index / msSize);
    const col = index % msSize;
    const neighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < msSize && nc >= 0 && nc < msSize) {
                neighbors.push(nr * msSize + nc);
            }
        }
    }
    return neighbors;
}

function renderBoard() {
    const boardEl = document.getElementById('msBoard');
    boardEl.style.gridTemplateColumns = `repeat(${msSize}, 36px)`;
    boardEl.innerHTML = '';

    msBoard.forEach((cell, index) => {
        const cellEl = document.createElement('button');
        cellEl.className = 'ms-cell';
        
        if (cell.revealed) {
            cellEl.classList.add('revealed');
            if (cell.mine) {
                cellEl.classList.add('mine');
                cellEl.textContent = '💣';
            } else if (cell.adjacentMines > 0) {
                cellEl.textContent = cell.adjacentMines;
                const colors = ['', '#4ade80', '#facc15', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#14b8a6'];
                cellEl.style.color = colors[cell.adjacentMines] || '#fff';
            }
        } else if (cell.flagged) {
            cellEl.classList.add('flag');
            cellEl.textContent = '🚩';
        }

        cellEl.addEventListener('click', (e) => handleCellClick(index));
        cellEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleRightClick(index);
        });

        boardEl.appendChild(cellEl);
    });
}

function handleCellClick(index) {
    if (msGameOver || msBoard[index].flagged || msBoard[index].revealed) return;

    revealCell(index);

    if (msBoard[index].mine) {
        gameOver(false);
        return;
    }

    // Автораскрытие пустых
    if (msBoard[index].adjacentMines === 0) {
        const toReveal = [index];
        const visited = new Set([index]);
        
        while (toReveal.length > 0) {
            const current = toReveal.shift();
            for (const n of getNeighbors(current)) {
                if (visited.has(n)) continue;
                visited.add(n);
                if (!msBoard[n].revealed && !msBoard[n].flagged && !msBoard[n].mine) {
                    revealCell(n);
                    if (msBoard[n].adjacentMines === 0) toReveal.push(n);
                }
            }
        }
    }

    checkWin();
    renderBoard();
}

function revealCell(index) {
    if (!msBoard[index].revealed) {
        msBoard[index].revealed = true;
        msRevealed++;
    }
}

function handleRightClick(index) {
    if (msGameOver || msBoard[index].revealed) return;
    msBoard[index].flagged = !msBoard[index].flagged;
    msFlagsPlaced += msBoard[index].flagged ? 1 : -1;
    document.getElementById('msFlags').textContent = msFlagsPlaced;
    renderBoard();
}

function checkWin() {
    if (msRevealed === msSize * msSize - msMinesCount) {
        gameOver(true);
    }
}

function gameOver(won) {
    msGameOver = true;
    msBoard.forEach(cell => { if (cell.mine) cell.revealed = true; });
    renderBoard();

    const el = document.getElementById('msGameOver');
    const btn = document.getElementById('msNewGame');
    
    if (won) {
        const reward = msBet * 2;
        userBalance += reward;
        el.className = 'ms-gameover win';
        el.innerHTML = `🎉 <b>ПОБЕДА!</b><br>+${formatNumber(reward)} 🪙`;
        tg.sendData(JSON.stringify({ action: 'minesweeper_win', bet: msBet, reward: reward }));
    } else {
        userBalance -= msBet;
        if (userBalance < 0) userBalance = 0;
        el.className = 'ms-gameover';
        el.innerHTML = `💥 <b>МИНА!</b><br>-${formatNumber(msBet)} 🪙`;
        tg.sendData(JSON.stringify({ action: 'minesweeper_lose', bet: msBet }));
    }

    btn.style.display = 'block';
    updateDisplay();
}