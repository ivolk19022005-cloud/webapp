// ============ СОСТОЯНИЕ ============
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Данные профиля (заглушка — бот обновит через sendData)
let coins = 1000;
let crystals = 50;
let level = 5;
let energy = 100;
let maxEnergy = 100;
let attack = 15;
let defense = 10;
let health = 150;
let maxHealth = 150;
let mana = 70;
let maxMana = 70;
let bankDeposit = 500;
let inventory = {};
let equipment = {};
let business = null;
let farm = null;
let mine = null;
let resources = { wheat: 10, corn: 5, apple: 2, coal: 8, iron: 3, gold: 1, diamond: 0, marble: 4 };
let bossHP = 0;
let bossMaxHP = 0;
let bossName = '';
let bossType = '';
let cooldowns = {};
let currentTab = 'games';

// Сапёр
let msBoard = [], msSize = 8, msMines = 10, msBet = 100;
let msFlags = 0, msRevealed = 0, msGameOver = false;

// Слоты
let slotsSpinning = false;
const SLOTS = ['🍒','🍊','🍋','🍉','⭐','7️⃣','🔔','💎'];

// ============ УТИЛИТЫ ============
function fmt(n) { return n >= 1e6 ? (n/1e6).toFixed(1)+'М' : n >= 1e3 ? (n/1e3).toFixed(1)+'К' : String(n); }
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function now() { return Date.now(); }

function updateCoins() {
    document.getElementById('coinsDisplay').innerHTML = 
        `💰 ${fmt(coins)} 🪙 | 💎 ${crystals} | 🎯 Ур. ${level} | ⚡ ${energy}/${maxEnergy}`;
}

function sendToBot(action, data = {}) {
    tg.sendData(JSON.stringify({ action, ...data }));
}

function showAlert(msg) {
    alert(msg);
}

// ============ ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ============
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    const el = document.getElementById('tabContent');
    el.innerHTML = '';
    
    switch(tab) {
        case 'games': renderGames(el); break;
        case 'actions': renderActions(el); break;
        case 'shop': renderShop(el); break;
        case 'business': renderBusiness(el); break;
        case 'profile': renderProfile(el); break;
    }
}

// ============ ИГРЫ ============
function renderGames(el) {
    el.innerHTML = `
        <div class="card-grid">
            <div class="card" onclick="openGame('minesweeper')">
                <div class="emoji">💣</div><div class="title">Сапёр</div><div class="sub">Ставка ×2</div>
            </div>
            <div class="card" onclick="openGame('slots')">
                <div class="emoji">🎰</div><div class="title">Слоты</div><div class="sub">До ×10</div>
            </div>
            <div class="card" onclick="openGame('dice')">
                <div class="emoji">🎲</div><div class="title">Кубик</div><div class="sub">Угадай 1-6</div>
            </div>
            <div class="card" onclick="openGame('coin')">
                <div class="emoji">🪙</div><div class="title">Монетка</div><div class="sub">Орёл/Решка</div>
            </div>
            <div class="card" onclick="openGame('roulette')">
                <div class="emoji">🎡</div><div class="title">Рулетка</div><div class="sub">×1.5 – ×10</div>
            </div>
            <div class="card" onclick="openGame('va_bank')">
                <div class="emoji">💎</div><div class="title">Ва-Банк</div><div class="sub">Всё или ×2</div>
            </div>
        </div>
        <div id="gameArea"></div>`;
}

function openGame(game) {
    const area = document.getElementById('gameArea');
    area.innerHTML = '<button class="back-btn" onclick="closeGame()">← Назад к играм</button>';
    
    const content = document.createElement('div');
    
    switch(game) {
        case 'minesweeper': renderMS(content); break;
        case 'slots': renderSlotMachine(content); break;
        case 'dice': renderDiceGame(content); break;
        case 'coin': renderCoinGame(content); break;
        case 'roulette': renderRouletteGame(content); break;
        case 'va_bank': renderVaBankGame(content); break;
    }
    
    area.appendChild(content);
}

function closeGame() {
    document.getElementById('gameArea').innerHTML = '';
}

// САПЁР
function renderMS(el) {
    el.innerHTML = `
        <div class="ms-controls">
            <div class="ms-info">🚩 <span id="msFlags">0</span> 💣 <span id="msMines">10</span></div>
            <div class="ms-bet-group">
                <input type="number" id="msBet" value="100" min="10">
                <button class="buy-btn" onclick="setMsBet()">Ставка</button>
            </div>
            <div class="ms-difficulty">
                <button class="active" data-s="8" data-m="10" onclick="changeMSDifficulty(this)">8×8</button>
                <button data-s="10" data-m="15" onclick="changeMSDifficulty(this)">10×10</button>
                <button data-s="12" data-m="20" onclick="changeMSDifficulty(this)">12×12</button>
            </div>
        </div>
        <div class="ms-board" id="msBoard"></div>
        <div id="msResult"></div>
        <button class="big-btn" id="msNewGame" onclick="startMS()" style="display:none;background:linear-gradient(135deg,#22c55e,#16a34a)">🔄 Новая игра</button>`;
    startMS();
}

function changeMSDifficulty(btn) {
    document.querySelectorAll('.ms-difficulty button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    msSize = +btn.dataset.s;
    msMines = +btn.dataset.m;
    document.getElementById('msMines').textContent = msMines;
    startMS();
}

function startMS() {
    msGameOver = false; msFlags = 0; msRevealed = 0; msBoard = [];
    const resEl = document.getElementById('msResult');
    const newBtn = document.getElementById('msNewGame');
    if (resEl) resEl.innerHTML = '';
    if (newBtn) newBtn.style.display = 'none';
    const flagsEl = document.getElementById('msFlags');
    const minesEl = document.getElementById('msMines');
    if (flagsEl) flagsEl.textContent = '0';
    if (minesEl) minesEl.textContent = msMines;
    
    const betInput = document.getElementById('msBet');
    msBet = betInput ? (parseInt(betInput.value) || 100) : 100;
    
    const total = msSize * msSize;
    const mines = new Set();
    while (mines.size < msMines) mines.add(Math.floor(Math.random() * total));
    
    for (let i = 0; i < total; i++) {
        msBoard.push({ mine: mines.has(i), revealed: false, flagged: false, adj: 0 });
    }
    
    for (let i = 0; i < total; i++) {
        if (!msBoard[i].mine) {
            msBoard[i].adj = getNeighbors(i).filter(n => msBoard[n].mine).length;
        }
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
    if (!el) return;
    el.style.gridTemplateColumns = `repeat(${msSize}, 34px)`;
    el.innerHTML = '';
    
    msBoard.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'ms-cell';
        
        if (c.revealed) {
            b.classList.add('revealed');
            if (c.mine) {
                b.classList.add('mine');
                b.textContent = '💣';
            } else if (c.adj) {
                b.textContent = c.adj;
                b.style.color = ['','#4ade80','#facc15','#f97316','#ef4444','#ec4899','#a855f7','#6366f1','#14b8a6'][c.adj] || '#fff';
            }
        } else if (c.flagged) {
            b.classList.add('flag');
            b.textContent = '🚩';
        }
        
        b.addEventListener('click', () => msClick(i));
        b.addEventListener('contextmenu', e => { e.preventDefault(); msFlag(i); });
        
        el.appendChild(b);
    });
}

function msClick(i) {
    if (msGameOver || msBoard[i].flagged || msBoard[i].revealed) return;
    
    msReveal(i);
    
    if (msBoard[i].mine) {
        msEnd(false);
        return;
    }
    
    if (!msBoard[i].adj) {
        const q = [i], v = new Set([i]);
        while (q.length) {
            for (const n of getNeighbors(q.shift())) {
                if (v.has(n)) continue;
                v.add(n);
                if (!msBoard[n].revealed && !msBoard[n].flagged && !msBoard[n].mine) {
                    msReveal(n);
                    if (!msBoard[n].adj) q.push(n);
                }
            }
        }
    }
    
    if (msRevealed === msSize * msSize - msMines) msEnd(true);
    renderMSBoard();
}

function msReveal(i) {
    if (!msBoard[i].revealed) {
        msBoard[i].revealed = true;
        msRevealed++;
    }
}

 function msFlag(i) {
    if (msGameOver || msBoard[i].revealed) return;
    msBoard[i].flagged = !msBoard[i].flagged;
    msFlags += msBoard[i].flagged ? 1 : -1;
    const el = document.getElementById('msFlags');
    if (el) el.textContent = msFlags;
    renderMSBoard();
}

function msEnd(won) {
    msGameOver = true;
    msBoard.forEach(c => { if (c.mine) c.revealed = true; });
    renderMSBoard();
    
    const el = document.getElementById('msResult');
    const btn = document.getElementById('msNewGame');
    
    if (won) {
        coins += msBet * 2;
        if (el) {
            el.className = 'result win';
            el.innerHTML = `🎉 <b>ПОБЕДА!</b> +${fmt(msBet * 2)} 🪙`;
        }
        sendToBot('game_result', { game: 'minesweeper', win: true, bet: msBet, reward: msBet * 2 });
    } else {
        coins -= msBet;
        if (coins < 0) coins = 0;
        if (el) {
            el.className = 'result lose';
            el.innerHTML = `💥 <b>МИНА!</b> -${fmt(msBet)} 🪙`;
        }
        sendToBot('game_result', { game: 'minesweeper', win: false, bet: msBet });
    }
    
    if (btn) btn.style.display = 'block';
    updateCoins();
}

function setMsBet() {
    const input = document.getElementById('msBet');
    if (!input) return;
    let v = parseInt(input.value);
    if (isNaN(v) || v < 10) v = 10;
    msBet = v;
    input.value = v;
    startMS();
}

// СЛОТЫ
function renderSlotMachine(el) {
    el.innerHTML = `
        <div class="slots-machine">
            <div class="slots-reels">
                <div class="slot-reel" id="r0">🍒</div>
                <div class="slot-reel" id="r1">🍊</div>
                <div class="slot-reel" id="r2">🍋</div>
            </div>
            <div class="bet-input-group">
                <label>💰 Ставка:</label>
                <input type="number" id="slotsBet" value="100" min="10">
            </div>
            <button class="big-btn" id="spinBtn" onclick="spinSlots()">🎰 КРУТИТЬ!</button>
            <div id="slotsResult"></div>
        </div>`;
}

function spinSlots() {
    if (slotsSpinning) return;
    
    const betInput = document.getElementById('slotsBet');
    const bet = betInput ? (parseInt(betInput.value) || 100) : 100;
    
    if (bet < 10) { showAlert('Минимальная ставка: 10 🪙'); return; }
    if (bet > coins) { showAlert('Недостаточно монет!'); return; }
    
    coins -= bet;
    updateCoins();
    slotsSpinning = true;
    
    const btn = document.getElementById('spinBtn');
    if (btn) btn.disabled = true;
    
    const resEl = document.getElementById('slotsResult');
    if (resEl) resEl.innerHTML = '';
    
    const reels = ['r0','r1','r2'].map(id => document.getElementById(id));
    reels.forEach(r => { if (r) r.classList.add('spinning'); });
    
    let spins = 0;
    const interval = setInterval(() => {
        reels.forEach(r => { if (r) r.textContent = SLOTS[Math.floor(Math.random() * SLOTS.length)]; });
        spins++;
        
        if (spins >= 15) {
            clearInterval(interval);
            reels.forEach(r => { if (r) r.classList.remove('spinning'); });
            
            const symbols = reels.map(r => r ? r.textContent : '🍒');
            finishSlots(symbols, bet);
        }
    }, 80);
}

function finishSlots(s, bet) {
    const el = document.getElementById('slotsResult');
    if (!el) return;
    
    const [a, b, c] = s;
    
    if (a === b && b === c) {
        const mult = a === '💎' ? 10 : a === '7️⃣' ? 7 : a === '⭐' ? 3 : a === '🔔' ? 5 : 1.5;
        const win = Math.floor(bet * mult);
        coins += win;
        el.className = 'result win';
        el.innerHTML = `🎉 <b>ДЖЕКПОТ!</b> ${s.join('')}<br>+${fmt(win)} 🪙`;
        sendToBot('game_result', { game: 'slots', win: true, bet, reward: win });
    } else if (a === b || b === c || a === c) {
        const win = Math.floor(bet * 1.2);
        coins += win;
        el.className = 'result win';
        el.innerHTML = `👍 <b>Пара!</b> ${s.join('')}<br>+${fmt(win)} 🪙`;
        sendToBot('game_result', { game: 'slots', win: true, bet, reward: win });
    } else {
        el.className = 'result lose';
        el.innerHTML = `😢 <b>Мимо!</b> ${s.join('')}<br>-${fmt(bet)} 🪙`;
        sendToBot('game_result', { game: 'slots', win: false, bet });
    }
    
    slotsSpinning = false;
    const btn = document.getElementById('spinBtn');
    if (btn) btn.disabled = false;
    updateCoins();
}

// КУБИК
function renderDiceGame(el) {
    el.innerHTML = `
        <div class="slots-machine">
            <h2>🎲 Угадай число</h2>
            <div class="bet-input-group">
                <label>💰 Ставка:</label>
                <input type="number" id="diceBet" value="100" min="10">
            </div>
            <div class="bet-input-group">
                <label>🎯 Число (1-6):</label>
                <select id="diceGuess">
                    ${[1,2,3,4,5,6].map(n => `<option value="${n}">${n}</option>`).join('')}
                </select>
            </div>
            <button class="big-btn" onclick="playDice()">🎲 БРОСИТЬ!</button>
            <div id="diceResult"></div>
        </div>`;
}

function playDice() {
    const betInput = document.getElementById('diceBet');
    const guessInput = document.getElementById('diceGuess');
    const bet = betInput ? (parseInt(betInput.value) || 100) : 100;
    const guess = guessInput ? parseInt(guessInput.value) : 1;
    
    if (bet > coins) { showAlert('Недостаточно монет!'); return; }
    
    coins -= bet;
    updateCoins();
    
    const roll = rnd(1, 6);
    const el = document.getElementById('diceResult');
    
    if (roll === guess) {
        const win = bet * 6;
        coins += win;
        if (el) {
            el.className = 'result win';
            el.innerHTML = `🎉 Выпало: <b>${roll}</b><br>+${fmt(win)} 🪙`;
        }
        sendToBot('game_result', { game: 'dice', win: true, bet, reward: win });
    } else {
        if (el) {
            el.className = 'result lose';
            el.innerHTML = `😢 Выпало: <b>${roll}</b> (ваше: ${guess})<br>-${fmt(bet)} 🪙`;
        }
        sendToBot('game_result', { game: 'dice', win: false, bet });
    }
    
    updateCoins();
}

// МОНЕТКА
function renderCoinGame(el) {
    el.innerHTML = `
        <div class="slots-machine">
            <h2>🪙 Орёл или Решка</h2>
            <div class="bet-input-group">
                <label>💰 Ставка:</label>
                <input type="number" id="coinBet" value="100" min="10">
            </div>
            <div style="display:flex;gap:10px;margin:10px 0">
                <button class="big-btn" style="background:#8b5cf6" onclick="playCoin('orel')">🦅 Орёл</button>
                <button class="big-btn" style="background:#6366f1" onclick="playCoin('reshka')">👑 Решка</button>
            </div>
            <div id="coinResult"></div>
        </div>`;
}

function playCoin(choice) {
    const betInput = document.getElementById('coinBet');
    const bet = betInput ? (parseInt(betInput.value) || 100) : 100;
    
    if (bet > coins) { showAlert('Недостаточно монет!'); return; }
    
    coins -= bet;
    updateCoins();
    
    const sides = ['orel', 'reshka'];
    const result = sides[rnd(0, 1)];
    const el = document.getElementById('coinResult');
    
    if (choice === result) {
        const win = bet * 2;
        coins += win;
        if (el) {
            el.className = 'result win';
            el.innerHTML = `🎉 <b>${result === 'orel' ? '🦅 Орёл' : '👑 Решка'}!</b><br>+${fmt(win)} 🪙`;
        }
        sendToBot('game_result', { game: 'coin', win: true, bet, reward: win });
    } else {
        if (el) {
            el.className = 'result lose';
            el.innerHTML = `😢 <b>${result === 'orel' ? '🦅 Орёл' : '👑 Решка'}</b><br>-${fmt(bet)} 🪙`;
        }
        sendToBot('game_result', { game: 'coin', win: false, bet });
    }
    
    updateCoins();
}

// РУЛЕТКА
function renderRouletteGame(el) {
    el.innerHTML = `
        <div class="slots-machine">
            <h2>🎡 Рулетка</h2>
            <div class="bet-input-group">
                <label>💰 Ставка:</label>
                <input type="number" id="roulBet" value="100" min="10">
            </div>
            <button class="big-btn" onclick="playRoulette()">🎡 КРУТИТЬ!</button>
            <div id="roulResult"></div>
        </div>`;
}

function playRoulette() {
    const betInput = document.getElementById('roulBet');
    const bet = betInput ? (parseInt(betInput.value) || 100) : 100;
    
    if (bet > coins) { showAlert('Недостаточно монет!'); return; }
    
    coins -= bet;
    updateCoins();
    
    const roll = Math.random();
    const el = document.getElementById('roulResult');
    
    if (roll < 0.3) {
        const mult = roll < 0.15 ? 1.5 : roll < 0.225 ? 2 : roll < 0.27 ? 3 : roll < 0.295 ? 5 : 10;
        const win = Math.floor(bet * mult);
        coins += win;
        if (el) {
            el.className = 'result win';
            el.innerHTML = `🎉 <b>×${mult}!</b><br>+${fmt(win)} 🪙`;
        }
        sendToBot('game_result', { game: 'roulette', win: true, bet, reward: win });
    } else {
        if (el) {
            el.className = 'result lose';
            el.innerHTML = `😢 <b>Не повезло!</b><br>-${fmt(bet)} 🪙`;
        }
        sendToBot('game_result', { game: 'roulette', win: false, bet });
    }
    
    updateCoins();
}

// ВА-БАНК
function renderVaBankGame(el) {
    el.innerHTML = `
        <div class="slots-machine">
            <h2>💎 Ва-Банк</h2>
            <p style="color:#aaa">Ставка: весь баланс (${fmt(coins)} 🪙)</p>
            <p style="color:#ffd700;margin:10px 0">50% — удвоить, 50% — потерять всё!</p>
            <button class="big-btn" style="background:linear-gradient(135deg,#ef4444,#dc2626)" onclick="playVaBank()">💎 ВА-БАНК!</button>
            <div id="vaResult"></div>
        </div>`;
}

function playVaBank() {
    const bet = coins;
    if (bet <= 0) { showAlert('Нечего ставить!'); return; }
    
    coins = 0;
    updateCoins();
    
    const win = Math.random() < 0.5;
    const el = document.getElementById('vaResult');
    
    if (win) {
        coins = bet * 2;
        if (el) {
            el.className = 'result win';
            el.innerHTML = `🎉 <b>УДВОЕНИЕ!</b><br>+${fmt(bet * 2)} 🪙`;
        }
        sendToBot('game_result', { game: 'va_bank', win: true, bet, reward: bet * 2 });
    } else {
        if (el) {
            el.className = 'result lose';
            el.innerHTML = `💀 <b>ПОТЕРЯНО ВСЁ!</b><br>-${fmt(bet)} 🪙`;
        }
        sendToBot('game_result', { game: 'va_bank', win: false, bet });
    }
    
    updateCoins();
}

// ============ ДЕЙСТВИЯ (ПРИКЛЮЧЕНИЯ, БОСС) ============
function renderActions(el) {
    // Приключения
    const adventures = {
        mountains: { name: '🏔️ Поход в горы', energy: 5, reward: [20,50], min_level: 1, cd: 60 },
        forest: { name: '🌳 Исследование леса', energy: 3, reward: [15,40], min_level: 1, cd: 120 },
        castle: { name: '🏰 Штурм замка', energy: 8, reward: [30,70], min_level: 3, cd: 180 },
        dragon: { name: '🐉 Охота на дракона', energy: 15, reward: [50,100], min_level: 5, cd: 240 },
        dungeon: { name: '🏴‍☠️ Подземелье', energy: 20, reward: [80,150], min_level: 8, cd: 300 }
    };
    
    let advHTML = '<div class="section-title">⚔️ Приключения</div><div class="adventure-list">';
    
    Object.entries(adventures).forEach(([key, adv]) => {
        const cdKey = 'adv_' + key;
        const onCD = cooldowns[cdKey] && now() < cooldowns[cdKey];
        const cdLeft = onCD ? Math.ceil((cooldowns[cdKey] - now()) / 1000) : 0;
        const canDo = energy >= adv.energy && level >= adv.min_level && !onCD;
        
        advHTML += `
            <div class="adv-card">
                <div class="adv-info">
                    <div class="adv-name">${adv.name}</div>
                    <div class="adv-desc">⚡${adv.energy} энергии | 🎯Ур.${adv.min_level}+ | ⏳КД ${adv.cd}с</div>
                    <div class="adv-reward">💰${adv.reward[0]}-${adv.reward[1]} 🪙</div>
                    ${onCD ? `<div style="color:#f87171;font-size:11px">⏳ КД: ${Math.floor(cdLeft/60)}м ${cdLeft%60}с</div>` : ''}
                </div>
                <button class="go-btn" ${canDo ? '' : 'disabled'} onclick="doAdventure('${key}', ${adv.energy}, ${adv.reward[0]}, ${adv.reward[1]}, ${adv.cd})">▶ Идти</button>
            </div>`;
    });
    
    advHTML += '</div>';
    
    // Босс
    if (!bossName) spawnBoss();
    
    advHTML += `
        <div class="section-title">👹 Босс</div>
        <div class="boss-card">
            <div class="boss-name">${bossName}</div>
            <div class="boss-type">${bossType}</div>
            <div class="hp-bar-container">
                <div class="hp-bar" style="width:${bossMaxHP > 0 ? (bossHP / bossMaxHP * 100) : 0}%"></div>
            </div>
            <div style="margin:5px 0">❤️ ${bossHP}/${bossMaxHP}</div>
            <div class="boss-actions">
                <button class="attack-btn" onclick="attackBoss()">⚔️ Атаковать</button>
            </div>
            <div id="bossResult"></div>
        </div>`;
    
    el.innerHTML = advHTML;
}

function doAdventure(key, cost, minRew, maxRew, cd) {
    if (energy < cost) { showAlert('❌ Недостаточно энергии!'); return; }
    
    energy -= cost;
    const earned = rnd(minRew, maxRew);
    coins += earned;
    cooldowns['adv_' + key] = now() + cd * 1000;
    
    updateCoins();
    sendToBot('adventure_complete', { adv_type: key, coins: earned, energy: cost });
    showAlert(`✅ Приключение завершено!\n💰 +${earned} 🪙`);
    renderActions(document.getElementById('tabContent'));
}

function spawnBoss() {
    const bosses = [
        { name: 'Древний Дракон', hp: [800,1500], type: '👹 Обычный' },
        { name: 'Ледяной Гигант', hp: [700,1300], type: '👹 Обычный' },
        { name: 'Огненный Демон', hp: [900,1600], type: '👹 Обычный' }
    ];
    
    const tpl = bosses[rnd(0, bosses.length - 1)];
    bossName = tpl.name;
    bossType = tpl.type;
    bossHP = rnd(tpl.hp[0], tpl.hp[1]);
    bossMaxHP = bossHP;
}

function attackBoss() {
    if (bossHP <= 0) {
        spawnBoss();
        renderActions(document.getElementById('tabContent'));
        return;
    }
    
    const cdKey = 'boss_hit';
    if (cooldowns[cdKey] && now() < cooldowns[cdKey]) {
        const left = Math.ceil((cooldowns[cdKey] - now()) / 1000);
        document.getElementById('bossResult').innerHTML = `<div class="result info">⏳ КД: ${Math.floor(left/60)}м ${left%60}с</div>`;
        return;
    }
    
    cooldowns[cdKey] = now() + 600000; // 10 минут
    
    const dmg = rnd(Math.floor(attack * 0.8), attack);
    bossHP -= dmg;
    if (bossHP < 0) bossHP = 0;
    
    const earned = rnd(10, 100) + attack;
    coins += earned;
    updateCoins();
    
    const killed = bossHP <= 0;
    const resEl = document.getElementById('bossResult');
    
    if (killed) {
        const bonusCoins = rnd(3000, 8000);
        coins += bonusCoins;
        if (resEl) {
            resEl.className = 'result win';
            resEl.innerHTML = `🎉 <b>БОСС УБИТ!</b><br>⚔️ ${dmg} урона<br>💰 +${earned + bonusCoins} 🪙`;
        }
        sendToBot('boss_attack', { damage: dmg, coins: earned + bonusCoins, killed: true });
    } else {
        if (resEl) {
            resEl.className = 'result info';
            resEl.innerHTML = `⚔️ <b>-${dmg}</b> HP! +${earned} 🪙`;
        }
        sendToBot('boss_attack', { damage: dmg, coins: earned, killed: false });
    }
    
    updateCoins();
    
    if (killed) {
        setTimeout(() => {
            spawnBoss();
            renderActions(document.getElementById('tabContent'));
        }, 2000);
    } else {
        renderActions(document.getElementById('tabContent'));
    }
}

// ============ МАГАЗИН ============
function renderShop(el) {
    const shopData = {
        weapons: {
            'wooden_sword': { name: 'Деревянный меч', price: 15, attack: 5, currency: 'coins' },
            'iron_sword': { name: 'Железный меч', price: 50, attack: 12, currency: 'coins' }
        },
        armor: {
            'leather_armor': { name: 'Кожаный доспех', price: 300, defense: 8, currency: 'coins' },
            'chain_armor': { name: 'Кольчуга', price: 600, defense: 15, currency: 'coins' }
        },
        potions: {
            'health_potion': { name: 'Зелье здоровья', price: 50, health: 30, currency: 'coins' },
            'mana_potion': { name: 'Зелье маны', price: 40, mana: 25, currency: 'coins' },
            'energy_potion': { name: 'Зелье энергии', price: 80, energy: 20, currency: 'coins' }
        }
    };
    
    let html = '<div class="section-title">🛒 Категории</div>';
    html += '<div class="quick-actions">';
    html += '<button class="action-btn" onclick="showCat(\'weapons\')"><span class="emoji">⚔️</span>Оружие</button>';
    html += '<button class="action-btn" onclick="showCat(\'armor\')"><span class="emoji">🛡</span>Броня</button>';
    html += '<button class="action-btn" onclick="showCat(\'potions\')"><span class="emoji">🧪</span>Зелья</button>';
    html += '</div>';
    html += '<div id="shopItems"></div>';
    html += '<hr style="border-color:rgba(255,255,255,.1);margin:10px 0">';
    html += '<div class="section-title">🎒 Инвентарь</div>';
    html += '<div id="invItems"></div>';
    
    el.innerHTML = html;
    showCat('weapons');
    showInv();
}

function showCat(cat) {
    const shopData = {
        weapons: {
            'wooden_sword': { name: 'Деревянный меч', price: 15, attack: 5, currency: 'coins' },
            'iron_sword': { name: 'Железный меч', price: 50, attack: 12, currency: 'coins' }
        },
        armor: {
            'leather_armor': { name: 'Кожаный доспех', price: 300, defense: 8, currency: 'coins' },
            'chain_armor': { name: 'Кольчуга', price: 600, defense: 15, currency: 'coins' }
        },
        potions: {
            'health_potion': { name: 'Зелье здоровья', price: 50, health: 30, currency: 'coins' },
            'mana_potion': { name: 'Зелье маны', price: 40, mana: 25, currency: 'coins' },
            'energy_potion': { name: 'Зелье энергии', price: 80, energy: 20, currency: 'coins' }
        }
    };
    
    const items = shopData[cat];
    if (!items) return;
    
    const el = document.getElementById('shopItems');
    if (!el) return;
    
    el.innerHTML = Object.entries(items).map(([id, item]) => `
        <div class="shop-item">
            <div class="shop-info">
                <div class="shop-name">${item.name}</div>
                <div class="shop-stats">
                    ${item.attack ? '⚔️+' + item.attack : ''}
                    ${item.defense ? '🛡+' + item.defense : ''}
                    ${item.health ? '❤️+' + item.health : ''}
                    ${item.mana ? '🔮+' + item.mana : ''}
                    ${item.energy ? '⚡+' + item.energy : ''}
                </div>
                <div class="shop-price">${item.price} ${item.currency === 'crystals' ? '💎' : '🪙'}</div>
            </div>
            <button class="buy-btn" onclick="buyItem('${cat}', '${id}', ${item.price}, '${item.currency}', '${item.name}')">Купить</button>
        </div>
    `).join('');
}

function buyItem(cat, id, price, currency, name) {
    if (currency === 'crystals' && crystals < price) { showAlert('❌ Недостаточно кристаллов!'); return; }
    if (currency === 'coins' && coins < price) { showAlert('❌ Недостаточно монет!'); return; }
    
    if (currency === 'crystals') crystals -= price;
    else coins -= price;
    
    inventory[name] = (inventory[name] || 0) + 1;
    updateCoins();
    sendToBot('buy_item', { category: cat, item_id: id, price, currency, item_name: name });
    showAlert(`✅ Куплено: ${name}!`);
    showInv();
}

function showInv() {
    const el = document.getElementById('invItems');
    if (!el) return;
    
    const items = Object.entries(inventory).filter(([_, c]) => c > 0);
    
    if (!items.length) {
        el.innerHTML = '<div class="empty">📭 Инвентарь пуст</div>';
        return;
    }
    
    el.innerHTML = items.map(([name, count]) => {
        let btn = '';
        if (name.includes('Зелье')) {
            btn = `<button class="use-btn" onclick="useItem('${name}')">🧪 Исп.</button>`;
        } else if (name.includes('меч') || name.includes('Меч') || name.includes('посох')) {
            btn = `<button class="equip-btn" onclick="equipItem('weapon', '${name}')">⚔️ Надеть</button>`;
        } else if (name.includes('доспех') || name.includes('Кольчуга') || name.includes('латы') || name.includes('мантия')) {
            btn = `<button class="equip-btn" onclick="equipItem('armor', '${name}')">🛡 Надеть</button>`;
        }
        
        return `
            <div class="inv-item">
                <div>
                    <div class="inv-name">${name}</div>
                    <div class="inv-count">${count} шт.</div>
                </div>
                ${btn}
            </div>`;
    }).join('');
}

function useItem(name) {
    if (!inventory[name] || inventory[name] <= 0) return;
    
    inventory[name]--;
    if (inventory[name] <= 0) delete inventory[name];
    
    if (name.includes('здоровья')) health = Math.min(maxHealth, health + 30);
    else if (name.includes('маны')) mana = Math.min(maxMana, mana + 25);
    else if (name.includes('энергии')) energy = Math.min(maxEnergy, energy + 20);
    
    updateCoins();
    sendToBot('use_potion', { item_name: name });
    showAlert(`✅ Использовано: ${name}!`);
    showInv();
}

function equipItem(slot, name) {
    const old = equipment[slot];
    if (old) inventory[old] = (inventory[old] || 0) + 1;
    
    equipment[slot] = name;
    inventory[name]--;
    if (inventory[name] <= 0) delete inventory[name];
    
    updateCoins();
    sendToBot('equip_item', { slot, item_name: name });
    showAlert(`✅ Надето: ${name}!`);
    showInv();
}

// ============ БИЗНЕС ============
function renderBusiness(el) {
    let html = '';
    
    // Бизнес
    html += '<div class="section-title">💼 Бизнес</div>';
    if (business) {
        html += `
            <div class="entity-card">
                <div class="entity-name">${business.name}</div>
                <div class="entity-stats">⭐ Ур. ${business.level} | 📈 Доход: ${business.income}/ч</div>
                <div class="entity-income">📦 Накоплено: ${business.accumulated || 0} 🪙</div>
                <div class="btn-row">
                    <button class="collect-btn" onclick="collectBiz()">💰 Собрать</button>
                    <button class="sell-btn" onclick="sellBiz()">💸 Продать</button>
                </div>
            </div>`;
    } else {
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <div class="shop-name">🏪 Магазин "Удача"</div>
                    <div class="shop-price">💰 5000 🪙 | 📈 100/ч</div>
                </div>
                <button class="buy-btn" onclick="buyBiz()">Купить</button>
            </div>`;
    }
    
    // Ферма
    html += '<div class="section-title">🚜 Ферма</div>';
    if (farm) {
        html += `
            <div class="entity-card">
                <div class="entity-name">${farm.name}</div>
                <div class="entity-income">📦 Накоплено: ${farm.accumulated || 0} ${farm.resource || ''}</div>
                <div class="btn-row">
                    <button class="collect-btn" onclick="collectFarm()">📦 Собрать</button>
                    <button class="sell-btn" onclick="sellFarm()">💸 Продать</button>
                </div>
            </div>`;
    } else {
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <div class="shop-name">🌾 Пшеничное поле</div>
                    <div class="shop-price">💰 2000 🪙 | 📈 10 пшеницы/ч</div>
                </div>
                <button class="buy-btn" onclick="buyFarm()">Купить</button>
            </div>`;
    }
    
    // Шахта
    html += '<div class="section-title">⛏️ Шахта</div>';
    if (mine) {
        html += `
            <div class="entity-card">
                <div class="entity-name">${mine.name}</div>
                <div class="entity-income">📦 Накоплено: ${mine.accumulated || 0} ${mine.resource || ''}</div>
                <div class="btn-row">
                    <button class="collect-btn" onclick="collectMine()">📦 Собрать</button>
                    <button class="sell-btn" onclick="sellMine()">💸 Продать</button>
                </div>
            </div>`;
    } else {
        html += `
            <div class="shop-item">
                <div class="shop-info">
                    <div class="shop-name">⛏️ Угольная шахта</div>
                    <div class="shop-price">💰 3000 🪙 | 📈 5 угля/ч</div>
                </div>
                <button class="buy-btn" onclick="buyMine()">Купить</button>
            </div>`;
    }
    
    // Банк
    html += '<div class="section-title">🏦 Банк (депозит: ' + fmt(bankDeposit) + ' 🪙)</div>';
    html += `
        <div class="btn-row" style="margin-bottom:10px">
            <button class="collect-btn" onclick="bankDep()">💰 Пополнить</button>
            <button class="upgrade-btn" onclick="bankWithdraw()">💸 Снять</button>
        </div>`;
    
    // Биржа
    html += '<div class="section-title">📈 Биржа</div>';
    html += '<div id="exchangeArea"></div>';
    
    el.innerHTML = html;
    renderExchange();
}

function buyBiz() {
    if (coins < 5000) { showAlert('❌ Недостаточно монет!'); return; }
    coins -= 5000;
    business = { name: '🏪 Магазин "Удача"', level: 1, income: 100, accumulated: 0 };
    updateCoins();
    sendToBot('buy_business', { biz_id: 1 });
    showAlert('✅ Бизнес куплен!');
    renderBusiness(document.getElementById('tabContent'));
}

function collectBiz() {
    if (!business) return;
    const earned = rnd(80, 120);
    coins += earned;
    updateCoins();
    sendToBot('biz_collect', { income: earned });
    showAlert(`✅ Собрано: +${earned} 🪙`);
    renderBusiness(document.getElementById('tabContent'));
}

function sellBiz() {
    if (!business) return;
    coins += 3500;
    business = null;
    updateCoins();
    sendToBot('sell_business', { refund: 3500 });
    showAlert('💸 Бизнес продан за 3500 🪙');
    renderBusiness(document.getElementById('tabContent'));
}

function buyFarm() {
    if (coins < 2000) { showAlert('❌ Недостаточно монет!'); return; }
    coins -= 2000;
    farm = { name: '🌾 Пшеничное поле', resource: 'wheat', income: 10, accumulated: 0 };
    updateCoins();
    showAlert('✅ Ферма куплена!');
    renderBusiness(document.getElementById('tabContent'));
}

function collectFarm() {
    if (!farm) return;
    const earned = rnd(8, 12);
    resources[farm.resource] = (resources[farm.resource] || 0) + earned;
    coins += earned * 15;
    updateCoins();
    showAlert(`✅ Собрано: +${earned} ${farm.resource}`);
    renderBusiness(document.getElementById('tabContent'));
}

function sellFarm() {
    if (!farm) return;
    coins += 1400;
    farm = null;
    updateCoins();
    showAlert('💸 Ферма продана за 1400 🪙');
    renderBusiness(document.getElementById('tabContent'));
}

function buyMine() {
    if (coins < 3000) { showAlert('❌ Недостаточно монет!'); return; }
    coins -= 3000;
    mine = { name: '⛏️ Угольная шахта', resource: 'coal', income: 5, accumulated: 0 };
    updateCoins();
    showAlert('✅ Шахта куплена!');
    renderBusiness(document.getElementById('tabContent'));
}

function collectMine() {
    if (!mine) return;
    const earned = rnd(4, 6);
    resources[mine.resource] = (resources[mine.resource] || 0) + earned;
    coins += earned * 60;
    updateCoins();
    showAlert(`✅ Собрано: +${earned} ${mine.resource}`);
    renderBusiness(document.getElementById('tabContent'));
}

function sellMine() {
    if (!mine) return;
    coins += 2100;
    mine = null;
    updateCoins();
    showAlert('💸 Шахта продана за 2100 🪙');
    renderBusiness(document.getElementById('tabContent'));
}

function bankDep() {
    const amt = parseInt(prompt('Сумма пополнения:', '100'));
    if (!amt || amt <= 0 || amt > coins) { showAlert('❌ Неверная сумма!'); return; }
    coins -= amt;
    bankDeposit += amt;
    updateCoins();
    sendToBot('bank_deposit', { amount: amt });
    showAlert(`✅ Пополнено: +${amt} 🪙`);
    renderBusiness(document.getElementById('tabContent'));
}

function bankWithdraw() {
    const amt = parseInt(prompt('Сумма снятия:', '100'));
    if (!amt || amt <= 0 || amt > bankDeposit) { showAlert('❌ Неверная сумма!'); return; }
    coins += amt;
    bankDeposit -= amt;
    updateCoins();
    sendToBot('bank_withdraw', { amount: amt });
    showAlert(`✅ Снято: -${amt} 🪙`);
    renderBusiness(document.getElementById('tabContent'));
}

function renderExchange() {
    const el = document.getElementById('exchangeArea');
    if (!el) return;
    
    const prices = {
        wheat: { name: '🌾 Пшеница', price: 15 },
        corn: { name: '🌽 Кукуруза', price: 24 },
        apple: { name: '🍎 Яблоко', price: 45 },
        coal: { name: '⛏️ Уголь', price: 60 },
        iron: { name: '⚙️ Железо', price: 150 },
        gold: { name: '💰 Золото', price: 600 }
    };
    
    el.innerHTML = Object.entries(prices).map(([id, data]) => `
        <div class="shop-item">
            <div class="shop-info">
                <div class="shop-name">${data.name}</div>
                <div class="shop-price">💰 ${data.price} 🪙/шт | У вас: ${resources[id] || 0}</div>
            </div>
            <button class="buy-btn" onclick="sellRes('${id}', ${data.price})">Продать</button>
        </div>
    `).join('');
}

function sellRes(id, price) {
    const amt = parseInt(prompt(`Сколько продать? (цена: ${price} 🪙/шт)`, '1'));
    if (!amt || amt <= 0 || (resources[id] || 0) < amt) { showAlert('❌ Недостаточно ресурсов!'); return; }
    
    resources[id] -= amt;
    const earned = Math.floor(price * amt * 0.95);
    coins += earned;
    updateCoins();
    sendToBot('sell_resource', { resource: id, amount: amt, earned });
    showAlert(`✅ Продано ${amt} шт. за ${earned} 🪙`);
    renderExchange();
}

// ============ ПРОФИЛЬ ============
function renderProfile(el) {
    el.innerHTML = `
        <div class="profile-card">
            <p>👤 <b>${tg.initDataUnsafe?.user?.first_name || 'Игрок'}</b></p>
            <p>🎯 Уровень: <b>${level}</b></p>
            <p>💰 Монеты: <b>${fmt(coins)} 🪙</b></p>
            <p>💎 Кристаллы: <b>${crystals}</b></p>
            <p>⚔️ Атака: <b>${attack}</b> | 🛡 Защита: <b>${defense}</b></p>
            <p>❤️ HP: <b>${health}/${maxHealth}</b></p>
            <p>🔮 Мана: <b>${mana}/${maxMana}</b></p>
            <p>⚡ Энергия: <b>${energy}/${maxEnergy}</b></p>
            <p>🏦 Депозит: <b>${fmt(bankDeposit)} 🪙</b></p>
            <p>🛡 Экипировка: <b>${equipment.weapon || '—'} / ${equipment.armor || '—'}</b></p>
            <p>🎒 Предметов: <b>${Object.values(inventory).reduce((a,b) => a + b, 0)}</b></p>
        </div>`;
}

// ============ ЗАПУСК ============
document.addEventListener('DOMContentLoaded', () => {
    updateCoins();
    switchTab('games');
    
    tg.MainButton.setText('Закрыть');
    tg.MainButton.onClick(() => tg.close());
    tg.MainButton.show();
});
