// ============ ИНИЦИАЛИЗАЦИЯ ============
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user || {};
let userBalance = 0;
let userLevel = 1;
let userCrystals = 0;
let userAttack = 10;
let userDefense = 5;

// ============ СОСТОЯНИЕ ИГР ============
let currentGame = '';

// Сапёр
let msBoard = [], msSize = 8, msMinesCount = 10, msBet = 100;
let msFlagsPlaced = 0, msRevealed = 0, msGameOver = false;

// Слоты
const slotSymbols = ['🍒', '🍊', '🍋', '🍉', '⭐', '7️⃣', '🔔', '💎'];
let slotsBet = 100, slotsSpinning = false;

// ============ ЗАГРУЗКА ============
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    tg.MainButton.setText('Закрыть');
    tg.MainButton.onClick(() => tg.close());
    tg.MainButton.show();

    updateDisplay();
});

// ============ ДИСПЛЕЙ ============
function updateDisplay() {
    document.getElementById('coinsDisplay').textContent =
        `💰 ${formatNum(userBalance)} 🪙 | 💎 ${userCrystals} | 🎯 Ур. ${userLevel}`;

    document.getElementById('profileName').textContent = user.first_name || 'Игрок';
    document.getElementById('profileLevel').textContent = userLevel;
    document.getElementById('profileBalance').textContent = formatNum(userBalance) + ' 🪙';
    document.getElementById('profileCrystals').textContent = userCrystals;
    document.getElementById('profileAttack').textContent = userAttack;
    document.getElementById('profileDefense').textContent = userDefense;
}

function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'М';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'К';
    return String(n);
}

// ============ ВКЛАДКИ ============
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============ ОТПРАВКА РЕЗУЛЬТАТА БОТУ ============
function sendResult(type, data = {}) {
    tg.sendData(JSON.stringify({ action: type, ...data }));
}

// ============ ОТКРЫТИЕ ИГРЫ ============
function openGame(game) {
    currentGame = game;
    document.getElementById('gameGrid').style.display = 'none';

    const screen = document.getElementById('gameScreen');
    screen.style.display = 'block';

    if (game === 'minesweeper') {
        screen.innerHTML = `
            <div class="game-header">
                <button class="btn-back" onclick="closeGame()">← Назад</button>
                <h2>💣 Сапёр</h2>
            </div>
            <div class="ms-controls">
                <div class="ms-info">🚩 <span id="msFlags">0</span> 💣 <span id="msMines">10</span></div>
                <div class="ms-bet-group">
                    <input type="number" id="msBet" value="100" min="10">
                    <button class="set-btn" onclick="setMsBet()">Ставка</button>
                </div>
                <div class="ms-difficulty">
                    <button class="active" data-size="8" data-mines="10">8×8</button>
                    <button data-size="10" data-mines="15">10×10</button>
                    <button data-size="12" data-mines="20">12×12</button>
                </div>
            </div>
            <div class="ms-board" id="msBoard"></div>
            <div id="msResult"></div>
            <button class="new-game-btn" id="msNewGame" onclick="startMinesweeper()" style="display:none;">🔄 Новая игра</button>
        `;
        startMinesweeper();
        document.querySelectorAll('.ms-difficulty button').forEach(b => {
            b.addEventListener('click', () => {
                document.querySelectorAll('.ms-difficulty button').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                msSize = +b.dataset.size;
                msMinesCount = +b.dataset.mines;
                document.getElementById('msMines').textContent = msMinesCount;
                startMinesweeper();
            });
        });

    } else if (game === 'slots') {
        screen.innerHTML = `
            <div class="game-header">
                <button class="btn-back" onclick="closeGame()">← Назад</button>
                <h2>🎰 Слоты</h2>
            </div>
            <div class="slots-machine">
                <div class="slots-reels">
                    <div class="slot-reel" id="reel0">🍒</div>
                    <div class="slot-reel" id="reel1">🍊</div>
                    <div class="slot-reel" id="reel2">🍋</div>
                </div>
                <div class="bet-input-group">
                    <label>💰 Ставка (🪙):</label>
                    <input type="number" id="slotsBet" value="100" min="10">
                </div>
                <button class="play-btn-big" id="spinBtn" onclick="spinSlots()">🎰 КРУТИТЬ!</button>
                <div id="slotsResult"></div>
            </div>
        `;

    } else {
        screen.innerHTML = `
            <div class="game-header">
                <button class="btn-back" onclick="closeGame()">← Назад</button>
                <h2>🎮 ${game.toUpperCase()}</h2>
            </div>
            <p style="text-align:center; padding:40px;">🚧 Эта игра будет добавлена в следующем обновлении!</p>
        `;
    }
}

function closeGame() {
    document.getElementById('gameGrid').style.display = 'grid';
    document.getElementById('gameScreen').style.display = 'none';
    currentGame = '';
}

// ============ САПЁР ============
function setMsBet() {
    const inp = document.getElementById('msBet');
    let v = parseInt(inp.value);
    if (isNaN(v) || v < 10) v = 10;
    msBet = v;
    inp.value = v;
    startMinesweeper();
}

function startMinesweeper() {
    msGameOver = false; msFlagsPlaced = 0; msRevealed = 0; msBoard = [];
    document.getElementById('msResult').innerHTML = '';
    document.getElementById('msNewGame').style.display = 'none';
    document.getElementById('msFlags').textContent = '0';
    document.getElementById('msMines').textContent = msMinesCount;
    msBet = parseInt(document.getElementById('msBet')?.value) || 100;

    const total = msSize * msSize;
    const mines = new Set();
    while (mines.size < msMinesCount) mines.add(Math.floor(Math.random() * total));

    for (let i = 0; i < total; i++)
        msBoard.push({ mine: mines.has(i), revealed: false, flagged: false, adjacent: 0 });

    for (let i = 0; i < total; i++) {
        if (msBoard[i].mine) continue;
        msBoard[i].adjacent = getNeighbors(i).filter(n => msBoard[n].mine).length;
    }
    renderMSBoard();
}

function getNeighbors(i) {
    const r = Math.floor(i / msSize), c = i % msSize, res = [];
    for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < msSize && nc >= 0 && nc < msSize) res.push(nr * msSize + nc);
        }
    return res;
}

function renderMSBoard() {
    const el = document.getElementById('msBoard');
    el.style.gridTemplateColumns = `repeat(${msSize}, 36px)`;
    el.innerHTML = '';
    msBoard.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'ms-cell';
        if (c.revealed) {
            btn.classList.add('revealed');
            if (c.mine) { btn.classList.add('mine'); btn.textContent = '💣'; }
            else if (c.adjacent > 0) {
                btn.textContent = c.adjacent;
                btn.style.color = ['','#4ade80','#facc15','#f97316','#ef4444','#ec4899','#a855f7','#6366f1','#14b8a6'][c.adjacent]||'#fff';
            }
        } else if (c.flagged) { btn.classList.add('flag'); btn.textContent = '🚩'; }
        btn.addEventListener('click', () => msClick(i));
        btn.addEventListener('contextmenu', e => { e.preventDefault(); msRightClick(i); });
        el.appendChild(btn);
    });
}

function msClick(i) {
    if (msGameOver || msBoard[i].flagged || msBoard[i].revealed) return;
    msReveal(i);
    if (msBoard[i].mine) { msEnd(false); return; }
    if (msBoard[i].adjacent === 0) {
        const q = [i], v = new Set([i]);
        while (q.length) {
            for (const n of getNeighbors(q.shift())) {
                if (v.has(n)) continue; v.add(n);
                if (!msBoard[n].revealed && !msBoard[n].flagged && !msBoard[n].mine) {
                    msReveal(n);
                    if (!msBoard[n].adjacent) q.push(n);
                }
            }
        }
    }
    if (msRevealed === msSize * msSize - msMinesCount) msEnd(true);
    renderMSBoard();
}

function msReveal(i) { if (!msBoard[i].revealed) { msBoard[i].revealed = true; msRevealed++; } }

function msRightClick(i) {
    if (msGameOver || msBoard[i].revealed) return;
    msBoard[i].flagged = !msBoard[i].flagged;
    msFlagsPlaced += msBoard[i].flagged ? 1 : -1;
    document.getElementById('msFlags').textContent = msFlagsPlaced;
    renderMSBoard();
}

function msEnd(won) {
    msGameOver = true;
    msBoard.forEach(c => { if (c.mine) c.revealed = true; });
    renderMSBoard();
    const el = document.getElementById('msResult');
    const btn = document.getElementById('msNewGame');
    if (won) {
        userBalance += msBet * 2;
        el.className = 'ms-result win';
        el.innerHTML = `🎉 <b>ПОБЕДА!</b> +${formatNum(msBet * 2)} 🪙`;
        sendResult('game_result', { game: 'minesweeper', win: true, bet: msBet, reward: msBet * 2 });
    } else {
        userBalance -= msBet; if (userBalance < 0) userBalance = 0;
        el.className = 'ms-result lose';
        el.innerHTML = `💥 <b>МИНА!</b> -${formatNum(msBet)} 🪙`;
        sendResult('game_result', { game: 'minesweeper', win: false, bet: msBet });
    }
    btn.style.display = 'block';
    updateDisplay();
}

// ============ СЛОТЫ ============
function spinSlots() {
    if (slotsSpinning) return;
    const betInp = document.getElementById('slotsBet');
    slotsBet = parseInt(betInp.value) || 100;
    if (slotsBet < 10) { alert('Мин. ставка: 10 🪙'); return; }
    if (slotsBet > userBalance) { alert('Недостаточно монет!'); return; }

    userBalance -= slotsBet;
    updateDisplay();
    slotsSpinning = true;
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('slotsResult').innerHTML = '';

    const reels = [document.getElementById('reel0'), document.getElementById('reel1'), document.getElementById('reel2')];
    reels.forEach(r => r.classList.add('spinning'));

    let spins = 0;
    const maxSpins = 15;
    const interval = setInterval(() => {
        reels.forEach(r => r.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]);
        spins++;
        if (spins >= maxSpins) {
            clearInterval(interval);
            reels.forEach(r => r.classList.remove('spinning'));
            finishSlots(reels);
        }
    }, 100);
}

function finishSlots(reels) {
    const r0 = reels[0].textContent, r1 = reels[1].textContent, r2 = reels[2].textContent;
    const resultEl = document.getElementById('slotsResult');
    
    if (r0 === r1 && r1 === r2) {
        const mult = r0 === '💎' ? 10 : r0 === '7️⃣' ? 7 : r0 === '⭐' ? 3 : r0 === '🔔' ? 5 : 1.5;
        const win = Math.floor(slotsBet * mult);
        userBalance += win;
        resultEl.className = 'slots-result win';
        resultEl.innerHTML = `🎉 <b>ДЖЕКПОТ!</b> ${r0}${r1}${r2}<br>+${formatNum(win)} 🪙 (×${mult})`;
        sendResult('game_result', { game: 'slots', win: true, bet: slotsBet, reward: win, combo: r0+r1+r2 });
    } else if (r0 === r1 || r1 === r2 || r0 === r2) {
        const win = Math.floor(slotsBet * 1.2);
        userBalance += win;
        resultEl.className = 'slots-result win';
        resultEl.innerHTML = `👍 <b>Пара!</b> ${r0}${r1}${r2}<br>+${formatNum(win)} 🪙`;
        sendResult('game_result', { game: 'slots', win: true, bet: slotsBet, reward: win, combo: r0+r1+r2 });
    } else {
        resultEl.className = 'slots-result lose';
        resultEl.innerHTML = `😢 <b>Мимо!</b> ${r0}${r1}${r2}<br>-${formatNum(slotsBet)} 🪙`;
        sendResult('game_result', { game: 'slots', win: false, bet: slotsBet });
    }

    slotsSpinning = false;
    document.getElementById('spinBtn').disabled = false;
    updateDisplay();
}
