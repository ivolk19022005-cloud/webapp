// ============ СОСТОЯНИЕ ============
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const ST = {
    user: tg.initDataUnsafe?.user || {},
    coins: 0, crystals: 0, level: 1, attack: 10, defense: 5,
    health: 100, max_health: 100, mana: 50, max_mana: 50,
    energy: 100, max_energy: 100,
    inventory: {}, equipment: {},
    business: null, farm: null, mine: null,
    boss_hp: 0, boss_max_hp: 0, boss_name: '', boss_type: 'NORMAL',
    last_boss_hit: null,
    cooldowns: {},
    bank_deposit: 0,
    resources: { wheat: 0, corn: 0, apple: 0, coal: 0, iron: 0, gold: 0, diamond: 0, marble: 0 },
    exchange_prices: {}
};

// Сапёр
let msBoard = [], msSize = 8, msMines = 10, msBet = 100;
let msFlags = 0, msRevealed = 0, msGameOver = false;

// Слоты
let slotsSpinning = false;
const SLOTS = ['🍒','🍊','🍋','🍉','⭐','7️⃣','🔔','💎'];

// Приключения
const ADVENTURES = {
    mountains: { name: '🏔️ Поход в горы', energy: 5, reward: [20,50], xp: 10, cd: 60, min_level: 1 },
    forest: { name: '🌳 Исследование леса', energy: 3, reward: [15,40], xp: 8, cd: 120, min_level: 1 },
    castle: { name: '🏰 Штурм замка', energy: 8, reward: [30,70], xp: 15, cd: 180, min_level: 3 },
    dragon: { name: '🐉 Охота на дракона', energy: 15, reward: [50,100], xp: 25, cd: 240, min_level: 5 },
    dungeon: { name: '🏴‍☠️ Подземелье', energy: 20, reward: [80,150], xp: 35, cd: 300, min_level: 8 }
};

// Боссы
const BOSSES = [
    { name: 'Древний Дракон', hp: [800,1500], coins: [4000,8000], crystals: [5,15] },
    { name: 'Ледяной Гигант', hp: [700,1300], coins: [3500,7000], crystals: [4,12] },
    { name: 'Огненный Демон', hp: [900,1600], coins: [4500,9000], crystals: [6,18] },
    { name: 'Король Скелетов', hp: [600,1200], coins: [3000,6000], crystals: [3,10] },
    { name: 'Темный Маг', hp: [500,1000], coins: [2500,5000], crystals: [2,8] },
    { name: 'Громовой Зверь', hp: [750,1400], coins: [3800,7500], crystals: [5,14] }
];

const LEGENDARY_BOSSES = [
    { name: 'Пожиратель Богов', hp: [5000,10000], coins: [20000,50000], crystals: [50,150] },
    { name: 'Хранитель Бездны', hp: [4000,8000], coins: [15000,40000], crystals: [40,120] },
    { name: 'Первозданный Титан', hp: [6000,12000], coins: [25000,60000], crystals: [60,180] }
];

// Магазин
const SHOP = {
    weapons: {
        wooden_sword: { name: 'Деревянный меч', price: 15, attack: 5, currency: 'coins' },
        iron_sword: { name: 'Железный меч', price: 50, attack: 12, currency: 'coins' },
        legendary_sword: { name: 'Легендарный меч', price: 150, attack: 25, currency: 'crystals' },
        magic_staff: { name: 'Магический посох', price: 250, attack: 32, mana: 15, currency: 'crystals' }
    },
    armor: {
        leather_armor: { name: 'Кожаный доспех', price: 300, defense: 8, currency: 'coins' },
        chain_armor: { name: 'Кольчуга', price: 600, defense: 15, currency: 'coins' },
        steel_armor: { name: 'Стальные латы', price: 1000, defense: 25, currency: 'coins' },
        magic_robe: { name: 'Магическая мантия', price: 800, defense: 12, mana: 15, currency: 'coins' }
    },
    potions: {
        health_potion: { name: 'Зелье здоровья', price: 50, health: 30, currency: 'coins' },
        mana_potion: { name: 'Зелье маны', price: 40, mana: 25, currency: 'coins' },
        energy_potion: { name: 'Зелье энергии', price: 80, energy: 20, currency: 'coins' }
    },
    amulets: {
        fire_amulet: { name: '🔥 Амулет огня', price: 100, attack: 10, currency: 'coins' },
        water_amulet: { name: '💧 Амулет воды', price: 100, defense: 10, currency: 'coins' },
        earth_amulet: { name: '🌍 Амулет земли', price: 100, health: 20, currency: 'coins' },
        air_amulet: { name: '💨 Амулет воздуха', price: 150, mana: 20, currency: 'coins' },
        dark_amulet: { name: '🌑 Амулет тьмы', price: 500, attack: 25, defense: -10, currency: 'coins' },
        holy_amulet: { name: '✨ Святой амулет', price: 500, health: 30, defense: 15, currency: 'coins' },
        dragon_amulet: { name: '🐲 Амулет дракона', price: 1000, attack: 20, defense: 20, health: 20, mana: 20, currency: 'crystals' }
    },
    spells: {
        fireball: { name: '🔥 Огненный шар', price: 150, currency: 'coins' },
        heal: { name: '✨ Лечение', price: 200, currency: 'coins' },
        shield: { name: '🛡 Магический щит', price: 150, currency: 'coins' },
        lightning_bolt: { name: '⚡ Цепная молния', price: 350, currency: 'coins' },
        ice_spike: { name: '❄️ Ледяной шип', price: 180, currency: 'coins' },
        poison_cloud: { name: '🤢 Ядовитое облако', price: 300, currency: 'coins' },
        holy_light: { name: '☀️ Святой свет', price: 500, currency: 'crystals' },
        meteor_strike: { name: '☄️ Метеорит', price: 1500, currency: 'crystals' },
        dragon_breath: { name: '🐲 Дыхание дракона', price: 2500, currency: 'crystals' }
    }
};

// Бизнесы
const BUSINESSES = {
    1: { name: '🏪 Магазин "Удача"', price: 5000, income: 100, currency: 'coins' },
    2: { name: '🏭 Фабрика "Прогресс"', price: 25000, income: 600, currency: 'coins' },
    3: { name: '🏢 Корпорация "Империя"', price: 100000, income: 3000, currency: 'coins' },
    4: { name: '💎 Ювелирная Лавка', price: 500000, income: 15000, currency: 'coins' },
    5: { name: '🚀 Техно-Холдинг', price: 2000000, income: 50000, currency: 'coins' },
    6: { name: '🏨 Гостиница "Люкс"', price: 5000000, income: 80000, currency: 'coins' },
    7: { name: '🏦 Банк "Финанс"', price: 10000000, income: 150000, currency: 'coins' },
    8: { name: '⚗️ Алхимическая Лаборатория', price: 5, income: 1, currency: 'crystals' },
    9: { name: '🔮 Магическая Академия', price: 10, income: 2, currency: 'crystals' },
    10: { name: '🐉 Драконий Питомник', price: 25, income: 5, currency: 'crystals' }
};

// Фермы
const FARMS = {
    1: { name: '🌾 Пшеничное поле', price: 2000, resource: 'wheat', income: 10, currency: 'coins' },
    2: { name: '🌽 Кукурузная плантация', price: 10000, resource: 'corn', income: 5, currency: 'coins' },
    3: { name: '🍎 Яблоневый сад', price: 40000, resource: 'apple', income: 2, currency: 'coins' },
    4: { name: '💎 Кристальное поле', price: 10, resource: 'crystals', income: 1, currency: 'crystals', interval: 86400 },
    5: { name: '🔮 Радужная ферма', price: 25, resource: 'crystals', income: 2, currency: 'crystals', interval: 86400 }
};

// Шахты
const MINES = {
    1: { name: '⛏️ Угольная шахта', price: 3000, resource: 'coal', income: 5, currency: 'coins' },
    2: { name: '⚙️ Железный рудник', price: 15000, resource: 'iron', income: 2, currency: 'coins' },
    3: { name: '💰 Золотой прииск', price: 50000, resource: 'gold', income: 1, currency: 'coins' },
    4: { name: '💎 Алмазный карьер', price: 15, resource: 'crystals', income: 1, currency: 'crystals', interval: 86400 },
    5: { name: '🔮 Мифриловый рудник', price: 30, resource: 'crystals', income: 2, currency: 'crystals', interval: 86400 }
};

// Биржа
let EXCHANGE = {
    wheat: { name: '🌾 Пшеница', price: 15, min: 5, max: 25 },
    corn: { name: '🌽 Кукуруза', price: 24, min: 8, max: 40 },
    apple: { name: '🍎 Яблоко', price: 45, min: 15, max: 75 },
    coal: { name: '⛏️ Уголь', price: 60, min: 20, max: 100 },
    iron: { name: '⚙️ Железо', price: 150, min: 50, max: 250 },
    gold: { name: '💰 Золото', price: 600, min: 200, max: 1000 },
    diamond: { name: '💎 Алмаз', price: 1500, min: 500, max: 2500 },
    marble: { name: '🪨 Мрамор', price: 240, min: 80, max: 400 }


    // ============ УТИЛИТЫ ============
function fmt(n) { return n >= 1e6 ? (n/1e6).toFixed(1)+'М' : n >= 1e3 ? (n/1e3).toFixed(1)+'К' : String(n); }
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sendToBot(action, data = {}) { tg.sendData(JSON.stringify({ action, ...data, user_id: ST.user.id })); }
function updateCoins() { document.getElementById('coinsDisplay').innerHTML = `💰 ${fmt(ST.coins)} 🪙 | 💎 ${ST.crystals} | 🎯 ${ST.level} | ⚡ ${ST.energy}/${ST.max_energy}`; }
function now() { return Date.now(); }

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    renderTab('games');
    document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => renderTab(b.dataset.tab)));
    tg.MainButton.setText('Закрыть');
    tg.MainButton.onClick(() => tg.close());
    tg.MainButton.show();
    updateExchangePrices();
});

function loadProfile() {
    sendToBot('get_profile');
    ST.coins = 1000; ST.crystals = 50; ST.level = 5; ST.energy = 100; ST.max_energy = 100;
    ST.attack = 15; ST.defense = 10; ST.health = 150; ST.max_health = 150; ST.mana = 70; ST.max_mana = 70;
    ST.bank_deposit = 500;
    ST.resources = { wheat: 10, corn: 5, apple: 2, coal: 8, iron: 3, gold: 1, diamond: 0, marble: 4 };
    updateCoins();
}

function renderTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    const el = document.getElementById('tabContent');
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
            ${['💣:Сапёр:×2','🎰:Слоты:×10','🎲:Кубик:×6','🪙:Монетка:×2','🎡:Рулетка:×5','💎:Ва-Банк:×2']
                .map(g => { let [e,t,d] = g.split(':'); return `<div class="card" onclick="openGame('${t.toLowerCase().replace(' ','_').replace('-','_')}')"><div class="emoji">${e}</div><div class="title">${t}</div><div class="sub">${d}</div></div>`; }).join('')}
        </div>
        <div id="gameArea"></div>`;
}

function openGame(game) {
    const area = document.getElementById('gameArea');
    switch(game) {
        case 'minesweeper': case 'сапёр': renderMinesweeper(area); break;
        case 'slots': case 'слоты': renderSlots(area); break;
        case 'dice': case 'кубик': renderDice(area); break;
        case 'coin': case 'монетка': renderCoin(area); break;
        case 'roulette': case 'рулетка': renderRoulette(area); break;
        case 'va_bank': case 'ва_банк': renderVaBank(area); break;
    }
}

// САПЁР
function renderMinesweeper(el) {
    el.innerHTML = `
        <div style="margin-top:10px">
            <button class="back-btn" onclick="closeGame()">← Назад</button>
            <div class="ms-controls">
                <div class="ms-info">🚩 <span id="msFlags">0</span> 💣 <span id="msMines">10</span></div>
                <div class="ms-bet-group"><input type="number" id="msBet" value="100" min="10"><button class="set-btn" onclick="setMsBet()">Ставка</button></div>
                <div class="ms-difficulty"><button class="active" data-s="8" data-m="10">8×8</button><button data-s="10" data-m="15">10×10</button><button data-s="12" data-m="20">12×12</button></div>
            </div>
            <div class="ms-board" id="msBoard"></div>
            <div id="msResult"></div>
            <button class="big-btn" id="msNewGame" onclick="startMS()" style="display:none;background:linear-gradient(135deg,#22c55e,#16a34a)">🔄 Новая игра</button>
        </div>`;
    document.querySelectorAll('.ms-difficulty button').forEach(b => b.addEventListener('click', function(){
        document.querySelectorAll('.ms-difficulty button').forEach(x=>x.classList.remove('active'));
        this.classList.add('active');
        msSize=+this.dataset.s; msMines=+this.dataset.m;
        document.getElementById('msMines').textContent=msMines;
        startMS();
    }));
    startMS();
}

function startMS() {
    msGameOver=false; msFlags=0; msRevealed=0; msBoard=[];
    document.getElementById('msResult').innerHTML='';
    document.getElementById('msNewGame').style.display='none';
    document.getElementById('msFlags').textContent='0';
    document.getElementById('msMines').textContent=msMines;
    msBet=parseInt(document.getElementById('msBet')?.value)||100;
    const t=msSize*msSize, mines=new Set();
    while(mines.size<msMines) mines.add(Math.floor(Math.random()*t));
    for(let i=0;i<t;i++) msBoard.push({mine:mines.has(i),revealed:false,flagged:false,adj:0});
    for(let i=0;i<t;i++) if(!msBoard[i].mine) msBoard[i].adj=getNeighbors(i).filter(n=>msBoard[n].mine).length;
    renderMSBoard();
}

function getNeighbors(i){const r=Math.floor(i/msSize),c=i%msSize,res=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const nr=r+dr,nc=c+dc;if(nr>=0&&nr<msSize&&nc>=0&&nc<msSize)res.push(nr*msSize+nc);}return res;}
function renderMSBoard(){const el=document.getElementById('msBoard');el.style.gridTemplateColumns=`repeat(${msSize},34px)`;el.innerHTML='';msBoard.forEach((c,i)=>{const b=document.createElement('button');b.className='ms-cell';if(c.revealed){b.classList.add('revealed');if(c.mine){b.classList.add('mine');b.textContent='💣';}else if(c.adj){b.textContent=c.adj;b.style.color=['','#4ade80','#facc15','#f97316','#ef4444','#ec4899','#a855f7','#6366f1','#14b8a6'][c.adj]||'#fff';}}else if(c.flagged){b.classList.add('flag');b.textContent='🚩';}b.addEventListener('click',()=>msClick(i));b.addEventListener('contextmenu',e=>{e.preventDefault();msFlag(i);});el.appendChild(b);});}
function msClick(i){if(msGameOver||msBoard[i].flagged||msBoard[i].revealed)return;msReveal(i);if(msBoard[i].mine){msEnd(false);return;}if(!msBoard[i].adj){const q=[i],v=new Set([i]);while(q.length)for(const n of getNeighbors(q.shift()))if(!v.has(n)){v.add(n);if(!msBoard[n].revealed&&!msBoard[n].flagged&&!msBoard[n].mine){msReveal(n);if(!msBoard[n].adj)q.push(n);}}}if(msRevealed===msSize*msSize-msMines)msEnd(true);renderMSBoard();}
function msReveal(i){if(!msBoard[i].revealed){msBoard[i].revealed=true;msRevealed++;}}
function msFlag(i){if(msGameOver||msBoard[i].revealed)return;msBoard[i].flagged=!msBoard[i].flagged;msFlags+=msBoard[i].flagged?1:-1;document.getElementById('msFlags').textContent=msFlags;renderMSBoard();}
function msEnd(won){msGameOver=true;msBoard.forEach(c=>{if(c.mine)c.revealed=true;});renderMSBoard();const el=document.getElementById('msResult'),btn=document.getElementById('msNewGame');if(won){ST.coins+=msBet*2;el.className='result win';el.innerHTML=`🎉 <b>ПОБЕДА!</b> +${fmt(msBet*2)} 🪙`;sendToBot('game_result',{game:'minesweeper',win:true,bet:msBet,reward:msBet*2});}else{ST.coins-=msBet;if(ST.coins<0)ST.coins=0;el.className='result lose';el.innerHTML=`💥 <b>МИНА!</b> -${fmt(msBet)} 🪙`;sendToBot('game_result',{game:'minesweeper',win:false,bet:msBet});}btn.style.display='block';updateCoins();}
function setMsBet(){const i=document.getElementById('msBet');let v=parseInt(i.value);if(isNaN(v)||v<10)v=10;msBet=v;i.value=v;startMS();}

// СЛОТЫ
function renderSlots(el) {
    el.innerHTML = `
        <div style="margin-top:10px"><button class="back-btn" onclick="closeGame()">← Назад</button>
            <div class="slots-machine">
                <div class="slots-reels"><div class="slot-reel" id="r0">🍒</div><div class="slot-reel" id="r1">🍊</div><div class="slot-reel" id="r2">🍋</div></div>
                <div class="bet-input-group"><label>💰 Ставка:</label><input type="number" id="slotsBet" value="100" min="10"></div>
                <button class="big-btn" id="spinBtn" onclick="spinSlots()">🎰 КРУТИТЬ!</button>
                <div id="slotsResult"></div>
            </div></div>`;
}

function spinSlots() {
    if (slotsSpinning) return;
    const bet = parseInt(document.getElementById('slotsBet').value) || 100;
    if (bet < 10 || bet > ST.coins) return;
    ST.coins -= bet; updateCoins(); slotsSpinning = true;
    const btn = document.getElementById('spinBtn'); btn.disabled = true;
    document.getElementById('slotsResult').innerHTML = '';
    const reels = ['r0','r1','r2'].map(id => document.getElementById(id));
    reels.forEach(r => r.classList.add('spinning'));
    let spins = 0;
    const interval = setInterval(() => {
        reels.forEach(r => r.textContent = SLOTS[Math.floor(Math.random() * SLOTS.length)]);
        if (++spins >= 15) {
            clearInterval(interval); reels.forEach(r => r.classList.remove('spinning'));
            slotsFinish(reels.map(r => r.textContent), bet);
        }
    }, 80);
}

function slotsFinish(s, bet) {
    const el = document.getElementById('slotsResult');
    const [a,b,c] = s;
    if (a===b && b===c) {
        const mult = a==='💎'?10:a==='7️⃣'?7:a==='⭐'?3:a==='🔔'?5:1.5;
        const win = Math.floor(bet*mult); ST.coins += win;
        el.className='result win'; el.innerHTML=`🎉 <b>ДЖЕКПОТ!</b> ${s.join('')}<br>+${fmt(win)} 🪙`;
        sendToBot('game_result',{game:'slots',win:true,bet:bet,reward:win});
    } else if (a===b || b===c || a===c) {
        const win = Math.floor(bet*1.2); ST.coins += win;
        el.className='result win'; el.innerHTML=`👍 <b>Пара!</b> ${s.join('')}<br>+${fmt(win)} 🪙`;
        sendToBot('game_result',{game:'slots',win:true,bet:bet,reward:win});
    } else {
        el.className='result lose'; el.innerHTML=`😢 <b>Мимо!</b> ${s.join('')}<br>-${fmt(bet)} 🪙`;
        sendToBot('game_result',{game:'slots',win:false,bet:bet});
    }
    slotsSpinning=false; document.getElementById('spinBtn').disabled=false; updateCoins();
}

// КУБИК
function renderDice(el) {
    el.innerHTML = `
        <div style="margin-top:10px"><button class="back-btn" onclick="closeGame()">← Назад</button>
            <div class="slots-machine">
                <h2>🎲 Угадай число</h2>
                <div class="bet-input-group"><label>💰 Ставка:</label><input type="number" id="diceBet" value="100" min="10"></div>
                <div class="bet-input-group"><label>🎯 Число (1-6):</label><select id="diceGuess">${[...Array(6)].map((_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></div>
                <button class="big-btn" onclick="playDice()">🎲 БРОСИТЬ!</button>
                <div id="diceResult"></div>
            </div></div>`;
}

function playDice() {
    const bet = parseInt(document.getElementById('diceBet').value) || 100;
    const guess = parseInt(document.getElementById('diceGuess').value);
    if (bet > ST.coins) return;
    ST.coins -= bet; updateCoins();
    const roll = rnd(1,6);
    const el = document.getElementById('diceResult');
    if (roll === guess) {
        const win = bet * 6; ST.coins += win;
        el.className='result win'; el.innerHTML=`🎉 Выпало: <b>${roll}</b><br>+${fmt(win)} 🪙`;
        sendToBot('game_result',{game:'dice',win:true,bet:bet,reward:win});
    } else {
        el.className='result lose'; el.innerHTML=`😢 Выпало: <b>${roll}</b> (ваше: ${guess})<br>-${fmt(bet)} 🪙`;
        sendToBot('game_result',{game:'dice',win:false,bet:bet});
    }
    updateCoins();
}

// МОНЕТКА
function renderCoin(el) {
    el.innerHTML = `
        <div style="margin-top:10px"><button class="back-btn" onclick="closeGame()">← Назад</button>
            <div class="slots-machine">
                <h2>🪙 Орёл или Решка</h2>
                <div class="bet-input-group"><label>💰 Ставка:</label><input type="number" id="coinBet" value="100" min="10"></div>
                <div style="display:flex;gap:10px;margin:10px 0">
                    <button class="big-btn" style="background:#8b5cf6" onclick="playCoin('orel')">🦅 Орёл</button>
                    <button class="big-btn" style="background:#6366f1" onclick="playCoin('reshka')">👑 Решка</button>
                </div>
                <div id="coinResult"></div>
            </div></div>`;
}

function playCoin(choice) {
    const bet = parseInt(document.getElementById('coinBet').value) || 100;
    if (bet > ST.coins) return;
    ST.coins -= bet; updateCoins();
    const sides = ['orel','reshka'];
    const result = sides[rnd(0,1)];
    const el = document.getElementById('coinResult');
    if (choice === result) {
        const win = bet * 2; ST.coins += win;
        el.className='result win'; el.innerHTML=`🎉 <b>${result==='orel'?'🦅 Орёл':'👑 Решка'}!</b><br>+${fmt(win)} 🪙`;
        sendToBot('game_result',{game:'coin',win:true,bet:bet,reward:win});
    } else {
        el.className='result lose'; el.innerHTML=`😢 <b>${result==='orel'?'🦅 Орёл':'👑 Решка'}</b><br>-${fmt(bet)} 🪙`;
        sendToBot('game_result',{game:'coin',win:false,bet:bet});
    }
    updateCoins();
}

// РУЛЕТКА
function renderRoulette(el) {
    el.innerHTML = `
        <div style="margin-top:10px"><button class="back-btn" onclick="closeGame()">← Назад</button>
            <div class="slots-machine">
                <h2>🎡 Рулетка</h2>
                <div class="bet-input-group"><label>💰 Ставка:</label><input type="number" id="roulBet" value="100" min="10"></div>
                <button class="big-btn" onclick="playRoulette()">🎡 КРУТИТЬ!</button>
                <div id="roulResult"></div>
            </div></div>`;
}

function playRoulette() {
    const bet = parseInt(document.getElementById('roulBet').value) || 100;
    if (bet > ST.coins) return;
    ST.coins -= bet; updateCoins();
    const roll = Math.random();
    const el = document.getElementById('roulResult');
    if (roll < 0.3) {
        const mult = roll<0.15?1.5:roll<0.225?2:roll<0.27?3:roll<0.295?5:10;
        const win = Math.floor(bet*mult); ST.coins += win;
        el.className='result win'; el.innerHTML=`🎉 <b>×${mult}!</b><br>+${fmt(win)} 🪙`;
        sendToBot('game_result',{game:'roulette',win:true,bet:bet,reward:win});
    } else {
        el.className='result lose'; el.innerHTML=`😢 <b>Не повезло!</b><br>-${fmt(bet)} 🪙`;
        sendToBot('game_result',{game:'roulette',win:false,bet:bet});
    }
    updateCoins();
}

// ВА-БАНК
function renderVaBank(el) {
    el.innerHTML = `
        <div style="margin-top:10px"><button class="back-btn" onclick="closeGame()">← Назад</button>
            <div class="slots-machine">
                <h2>💎 Ва-Банк</h2>
                <p style="color:#aaa">Ставка: весь баланс (${fmt(ST.coins)} 🪙)</p>
                <p style="color:#ffd700">50% — удвоить, 50% — потерять всё!</p>
                <button class="big-btn" style="background:linear-gradient(135deg,#ef4444,#dc2626)" onclick="playVaBank()">💎 ВА-БАНК!</button>
                <div id="vaResult"></div>
            </div></div>`;
}

function playVaBank() {
    const bet = ST.coins;
    if (bet <= 0) return;
    ST.coins = 0; updateCoins();
    const win = Math.random() < 0.5;
    const el = document.getElementById('vaResult');
    if (win) {
        const reward = bet * 2; ST.coins = reward;
        el.className='result win'; el.innerHTML=`🎉 <b>УДВОЕНИЕ!</b><br>+${fmt(reward)} 🪙`;
        sendToBot('game_result',{game:'va_bank',win:true,bet:bet,reward:reward});
    } else {
        el.className='result lose'; el.innerHTML=`💀 <b>ПОТЕРЯНО ВСЁ!</b><br>-${fmt(bet)} 🪙`;
        sendToBot('game_result',{game:'va_bank',win:false,bet:bet});
    }
    updateCoins();
}

function closeGame() { document.getElementById('gameArea').innerHTML = ''; }
};


// ============ ДЕЙСТВИЯ (ПРИКЛЮЧЕНИЯ, БОСС) ============
function renderActions(el) {
    el.innerHTML = `
        <div class="section-title">⚔️ Приключения</div>
        <div class="adventure-list">${Object.entries(ADVENTURES).map(([k,v]) => `
            <div class="adv-card">
                <div class="adv-info">
                    <div class="adv-name">${v.name}</div>
                    <div class="adv-desc">⚡${v.energy} энергии | 🎯Ур.${v.min_level}+</div>
                    <div class="adv-reward">💰${v.reward[0]}-${v.reward[1]} 🪙 | ⭐${v.xp} XP</div>
                </div>
                <button class="go-btn" onclick="doAdventure('${k}')">▶ Идти</button>
            </div>`).join('')}</div>
        <div class="section-title">👹 Босс</div>
        <div class="boss-card" id="bossCard">
            <div class="boss-name" id="bossName">${ST.boss_name || 'Босс не загружен'}</div>
            <div class="boss-type" id="bossType">${ST.boss_type}</div>
            <div class="hp-bar-container"><div class="hp-bar" id="bossHPBar" style="width:${ST.boss_max_hp>0?(ST.boss_hp/ST.boss_max_hp*100):0}%"></div></div>
            <div id="bossHPText">❤️ ${ST.boss_hp}/${ST.boss_max_hp}</div>
            <div class="boss-actions"><button class="attack-btn" id="bossAtkBtn" onclick="attackBoss()">⚔️ Атаковать</button></div>
            <div id="bossResult"></div>
        </div>`;
    if (!ST.boss_name) spawnBoss();
}

function doAdventure(type) {
    const adv = ADVENTURES[type];
    if (!adv) return;
    if (ST.energy < adv.energy) { alert('❌ Недостаточно энергии!'); return; }
    if (ST.level < adv.min_level) { alert(`❌ Нужен ${adv.min_level} уровень!`); return; }
    const cooldownKey = `adv_${type}`;
    if (ST.cooldowns[cooldownKey] && now() < ST.cooldowns[cooldownKey]) {
        const left = Math.ceil((ST.cooldowns[cooldownKey] - now()) / 1000);
        alert(`⏳ КД: ${Math.floor(left/60)}м ${left%60}с`); return;
    }
    ST.energy -= adv.energy;
    ST.cooldowns[cooldownKey] = now() + adv.cd * 1000;
    const coins = rnd(adv.reward[0], adv.reward[1]);
    ST.coins += coins;
    updateCoins();
    sendToBot('adventure_complete', { adv_type: type, coins: coins, xp: adv.xp, energy: adv.energy });
    alert(`✅ ${adv.name} завершено!\n💰 +${coins} 🪙\n⭐ +${adv.xp} XP`);
    renderActions(document.getElementById('tabContent'));
}

function spawnBoss() {
    const legendary = Math.random() < 0.05;
    const pool = legendary ? LEGENDARY_BOSSES : BOSSES;
    const tpl = pool[rnd(0, pool.length-1)];
    ST.boss_name = tpl.name;
    ST.boss_type = legendary ? '🌟 ЛЕГЕНДАРНЫЙ' : '👹 Обычный';
    ST.boss_hp = rnd(tpl.hp[0], tpl.hp[1]);
    ST.boss_max_hp = ST.boss_hp;
    ST.boss_coins = rnd(tpl.coins[0], tpl.coins[1]);
    ST.boss_crystals = rnd(tpl.crystals[0], tpl.crystals[1]);
    updateBossUI();
}

function updateBossUI() {
    const nameEl = document.getElementById('bossName');
    const typeEl = document.getElementById('bossType');
    const barEl = document.getElementById('bossHPBar');
    const textEl = document.getElementById('bossHPText');
    if (nameEl) nameEl.textContent = ST.boss_name;
    if (typeEl) typeEl.textContent = ST.boss_type;
    if (barEl) barEl.style.width = ST.boss_max_hp > 0 ? (ST.boss_hp / ST.boss_max_hp * 100) + '%' : '0%';
    if (textEl) textEl.textContent = `❤️ ${ST.boss_hp}/${ST.boss_max_hp}`;
}

function attackBoss() {
    if (ST.boss_hp <= 0) { spawnBoss(); renderActions(document.getElementById('tabContent')); return; }
    const cooldownKey = 'boss_hit';
    if (ST.cooldowns[cooldownKey] && now() < ST.cooldowns[cooldownKey]) {
        const left = Math.ceil((ST.cooldowns[cooldownKey] - now()) / 1000);
        document.getElementById('bossResult').innerHTML = `<div class="result info">⏳ КД: ${Math.floor(left/60)}м ${left%60}с</div>`;
        return;
    }
    ST.cooldowns[cooldownKey] = now() + 600000;
    const dmg = rnd(Math.floor(ST.attack*0.8), ST.attack);
    ST.boss_hp -= dmg;
    if (ST.boss_hp < 0) ST.boss_hp = 0;
    const coinsEarned = rnd(10, 100) + ST.attack;
    ST.coins += coinsEarned;
    updateCoins();
    updateBossUI();
    const killed = ST.boss_hp <= 0;
    const resultEl = document.getElementById('bossResult');
    if (killed) {
        ST.coins += ST.boss_coins; ST.crystals += ST.boss_crystals;
        resultEl.innerHTML = `<div class="result win">🎉 <b>БОСС УБИТ!</b><br>⚔️ ${dmg} урона<br>💰 +${coinsEarned+ST.boss_coins} 🪙<br>💎 +${ST.boss_crystals} кристаллов</div>`;
        sendToBot('boss_attack', { damage: dmg, coins_earned: coinsEarned+ST.boss_coins, boss_hp: 0, boss_killed: true });
    } else {
        resultEl.innerHTML = `<div class="result info">⚔️ <b>-${dmg}</b> HP! +${coinsEarned} 🪙</div>`;
        sendToBot('boss_attack', { damage: dmg, coins_earned: coinsEarned, boss_hp: ST.boss_hp, boss_killed: false });
    }
    updateCoins();
    if (killed) setTimeout(() => { spawnBoss(); renderActions(document.getElementById('tabContent')); }, 2000);
}

// ============ МАГАЗИН ============
function renderShop(el) {
    const cats = { weapons: '⚔️ Оружие', armor: '🛡 Броня', potions: '🧪 Зелья', amulets: '✨ Амулеты', spells: '📜 Заклинания' };
    el.innerHTML = `<div class="section-title">🛒 Категории</div>
        <div class="quick-actions">${Object.entries(cats).map(([k,v])=>`<button class="action-btn" onclick="showShopCat('${k}')"><span class="emoji">${v.split(' ')[0]}</span>${v.split(' ')[1]}</button>`).join('')}</div>
        <div id="shopItems"></div>
        <hr style="border-color:rgba(255,255,255,.1);margin:10px 0">
        <div class="section-title">🎒 Инвентарь</div>
        <div id="invItems"></div>`;
    showShopCat('weapons');
    showInventory();
}

function showShopCat(cat) {
    const items = SHOP[cat];
    const el = document.getElementById('shopItems');
    el.innerHTML = Object.entries(items).map(([id,item]) => `
        <div class="shop-item">
            <div class="shop-info">
                <div class="shop-name">${item.name}</div>
                <div class="shop-stats">${item.attack?'⚔️+'+item.attack:''}${item.defense?'🛡+'+item.defense:''}${item.health?'❤️+'+item.health:''}${item.mana?'🔮+'+item.mana:''}${item.energy?'⚡+'+item.energy:''}</div>
                <div class="shop-price">${item.price} ${item.currency==='crystals'?'💎':'🪙'}</div>
            </div>
            <button class="buy-btn" onclick="buyItem('${cat}','${id}',${item.price},'${item.currency}')">Купить</button>
        </div>`).join('');
}

function buyItem(cat, id, price, currency) {
    if (currency === 'crystals' && ST.crystals < price) { alert('❌ Недостаточно кристаллов!'); return; }
    if (currency === 'coins' && ST.coins < price) { alert('❌ Недостаточно монет!'); return; }
    if (currency === 'crystals') ST.crystals -= price;
    else ST.coins -= price;
    const item = SHOP[cat][id];
    ST.inventory[item.name] = (ST.inventory[item.name] || 0) + 1;
    updateCoins();
    sendToBot('buy_item', { category: cat, item_id: id, price: price, currency: currency });
    alert(`✅ Куплено: ${item.name}!`);
    showInventory();
}

function showInventory() {
    const el = document.getElementById('invItems');
    const items = Object.entries(ST.inventory).filter(([_,c]) => c > 0);
    if (!items.length) { el.innerHTML = '<div class="empty">📭 Инвентарь пуст</div>'; return; }
    el.innerHTML = items.map(([name, count]) => {
        const isPotion = Object.values(SHOP.potions).some(p => p.name === name);
        const isWeapon = Object.values(SHOP.weapons).some(w => w.name === name);
        const isArmor = Object.values(SHOP.armor).some(a => a.name === name);
        let btn = '';
        if (isPotion) btn = `<button class="use-btn" onclick="useItem('${name}')">Исп.</button>`;
        else if (isWeapon) btn = `<button class="equip-btn" onclick="equipItem('weapon','${name}')">Надеть</button>`;
        else if (isArmor) btn = `<button class="equip-btn" onclick="equipItem('armor','${name}')">Надеть</button>`;
        return `<div class="inv-item"><div><div class="inv-name">${name}</div><div class="inv-count">${count} шт.</div></div>${btn}</div>`;
    }).join('');
}

function useItem(name) {
    const potion = Object.values(SHOP.potions).find(p => p.name === name);
    if (!potion) return;
    if ((ST.inventory[name]||0) <= 0) return;
    ST.inventory[name]--;
    if (ST.inventory[name] <= 0) delete ST.inventory[name];
    if (potion.health) ST.health = Math.min(ST.max_health, ST.health + potion.health);
    if (potion.mana) ST.mana = Math.min(ST.max_mana, ST.mana + potion.mana);
    if (potion.energy) ST.energy = Math.min(ST.max_energy, ST.energy + potion.energy);
    updateCoins();
    sendToBot('use_potion', { item_name: name });
    alert(`✅ Использовано: ${name}!`);
    showInventory();
}

function equipItem(slot, name) {
    const old = ST.equipment[slot];
    if (old) ST.inventory[old] = (ST.inventory[old] || 0) + 1;
    ST.equipment[slot] = name;
    ST.inventory[name]--;
    if (ST.inventory[name] <= 0) delete ST.inventory[name];
    const cat = slot === 'weapon' ? 'weapons' : 'armor';
    const item = Object.values(SHOP[cat]).find(i => i.name === name);
    if (item) {
        if (slot === 'weapon') ST.attack = 10 + (item.attack || 0);
        else ST.defense = 5 + (item.defense || 0);
    }
    updateCoins();
    sendToBot('equip_item', { slot, item_name: name });
    alert(`✅ Надето: ${name}!`);
    showInventory();
}

// ============ БИЗНЕС ============
function renderBusiness(el) {
    const sections = [
        { title: '💼 Бизнес', data: BUSINESSES, my: ST.business, myRender: renderMyBusiness, listRender: renderBizList, buyFn: buyBusiness, key: 'business' },
        { title: '🚜 Ферма', data: FARMS, my: ST.farm, myRender: renderMyFarm, listRender: renderFarmList, buyFn: buyFarm, key: 'farm' },
        { title: '⛏️ Шахта', data: MINES, my: ST.mine, myRender: renderMyMine, listRender: renderMineList, buyFn: buyMine, key: 'mine' },
    ];
    el.innerHTML = sections.map(s => {
        if (s.my) return `<div class="section-title">${s.title}</div><div id="${s.key}Area"></div>`;
        return `<div class="section-title">${s.title}</div><div id="${s.key}List"></div>`;
    }).join('') + `
        <div class="section-title">🏦 Банк (депозит: ${fmt(ST.bank_deposit)} 🪙)</div>
        <div class="btn-row" style="margin-bottom:10px">
            <button class="collect-btn" onclick="bankDeposit()">💰 Пополнить</button>
            <button class="upgrade-btn" onclick="bankWithdraw()">💸 Снять</button>
        </div>
        <div class="section-title">📈 Биржа | <span style="color:#888;font-size:11px">Комиссия 5%</span></div>
        <div id="exchangeArea"></div>`;
    if (ST.business) renderMyBusiness(document.getElementById('businessArea'));
    else renderBizList(document.getElementById('businessList'));
    if (ST.farm) renderMyFarm(document.getElementById('farmArea'));
    else renderFarmList(document.getElementById('farmList'));
    if (ST.mine) renderMyMine(document.getElementById('mineArea'));
    else renderMineList(document.getElementById('mineList'));
    renderExchange();
}

function renderBizList(el) {
    if (!el) return;
    el.innerHTML = Object.entries(BUSINESSES).map(([id,b]) => `
        <div class="shop-item"><div class="shop-info"><div class="shop-name">${b.name}</div><div class="shop-price">💰${b.price} ${b.currency==='crystals'?'💎':'🪙'} | 📈${b.income}/ч</div></div><button class="buy-btn" onclick="buyBusiness(${id})">Купить</button></div>`).join('');
}

function renderMyBusiness(el) {
    if (!el || !ST.business) return;
    const b = ST.business;
    const cfg = BUSINESSES[b.id];
    el.innerHTML = `<div class="entity-card">
        <div class="entity-name">${cfg.name}</div>
        <div class="entity-stats">⭐ Ур. ${b.level} | 📈 Доход: ${Math.floor(cfg.income*(1.5**(b.level-1)))} ${cfg.currency==='crystals'?'💎':'🪙'}/ч</div>
        <div class="entity-income">📦 Накоплено: ${b.accumulated||0}</div>
        <div class="btn-row">
            <button class="collect-btn" onclick="collectBiz()">💰 Собрать</button>
            <button class="upgrade-btn" onclick="upgradeBiz()">⬆ Улучшить (${Math.floor(cfg.price*(2**b.level))})</button>
            <button class="sell-btn" onclick="sellBiz()">💸 Продать</button>
        </div></div>`;
}

function buyBusiness(id) {
    const b = BUSINESSES[id];
    if ((b.currency==='crystals'?ST.crystals:ST.coins) < b.price) { alert('❌ Недостаточно средств!'); return; }
    if (b.currency==='crystals') ST.crystals -= b.price; else ST.coins -= b.price;
    ST.business = { id: id, level: 1, accumulated: 0, last_collect: now() };
    updateCoins(); sendToBot('buy_business', { biz_id: id }); renderBusiness(document.getElementById('tabContent'));
}

function collectBiz() {
    if (!ST.business) return;
    const cfg = BUSINESSES[ST.business.id];
    const income = Math.floor(cfg.income * (1.5 ** (ST.business.level - 1)));
    const elapsed = (now() - (ST.business.last_collect||now())) / 3600000;
    const earned = Math.floor(elapsed * income);
    if (earned < 1) { alert('⏳ Ещё не накопилось!'); return; }
    ST.coins += earned; ST.business.accumulated = 0; ST.business.last_collect = now();
    updateCoins(); sendToBot('biz_collect', { income: earned }); renderBusiness(document.getElementById('tabContent'));
}

function upgradeBiz() {
    if (!ST.business || ST.business.level >= 10) return;
    const cfg = BUSINESSES[ST.business.id];
    const cost = Math.floor(cfg.price * (2 ** ST.business.level));
    if (ST.coins < cost) { alert('❌ Недостаточно монет!'); return; }
    ST.coins -= cost; ST.business.level++;
    updateCoins(); sendToBot('biz_upgrade', { cost: cost }); renderBusiness(document.getElementById('tabContent'));
}

function sellBiz() {
    if (!ST.business) return;
    const cfg = BUSINESSES[ST.business.id];
    const refund = Math.floor(cfg.price * 0.7);
    ST.coins += refund; ST.business = null;
    updateCoins(); sendToBot('sell_business', {}); renderBusiness(document.getElementById('tabContent'));
}

// ФЕРМА (упрощённо)
function renderFarmList(el) { if(!el)return; el.innerHTML = Object.entries(FARMS).map(([id,f])=>`<div class="shop-item"><div class="shop-info"><div class="shop-name">${f.name}</div><div class="shop-price">💰${f.price} ${f.currency} | 📈${f.income}/ч</div></div><button class="buy-btn" onclick="buyFarm(${id})">Купить</button></div>`).join(''); }
function renderMyFarm(el) { if(!el||!ST.farm)return; const f=ST.farm,cfg=FARMS[f.id]; el.innerHTML=`<div class="entity-card"><div class="entity-name">${cfg.name}</div><div class="entity-income">📦 Накоплено: ${f.accumulated||0} ${cfg.resource}</div><div class="btn-row"><button class="collect-btn" onclick="collectFarm()">📦 Собрать</button><button class="sell-btn" onclick="sellFarm()">💸 Продать</button></div></div>`; }
function buyFarm(id){const f=FARMS[id];if(ST.coins<f.price)return;ST.coins-=f.price;ST.farm={id:id,level:1,accumulated:0,last_collect:now()};updateCoins();renderBusiness(document.getElementById('tabContent'));}
function collectFarm(){if(!ST.farm)return;const cfg=FARMS[ST.farm.id];const income=cfg.income;const elapsed=(now()-(ST.farm.last_collect||now()))/3600000;const earned=Math.floor(elapsed*income);if(earned<1){alert('⏳ Ещё нет!');return;}ST.coins+=earned*10;ST.farm.accumulated=0;ST.farm.last_collect=now();if(ST.resources[cfg.resource]!==undefined)ST.resources[cfg.resource]+=earned;updateCoins();renderBusiness(document.getElementById('tabContent'));}
function sellFarm(){if(!ST.farm)return;ST.coins+=Math.floor(FARMS[ST.farm.id].price*0.7);ST.farm=null;updateCoins();renderBusiness(document.getElementById('tabContent'));}

// ШАХТА (упрощённо)
function renderMineList(el) { if(!el)return; el.innerHTML = Object.entries(MINES).map(([id,m])=>`<div class="shop-item"><div class="shop-info"><div class="shop-name">${m.name}</div><div class="shop-price">💰${m.price} ${m.currency} | 📈${m.income}/ч</div></div><button class="buy-btn" onclick="buyMine(${id})">Купить</button></div>`).join(''); }
function renderMyMine(el) { if(!el||!ST.mine)return; const m=ST.mine,cfg=MINES[m.id]; el.innerHTML=`<div class="entity-card"><div class="entity-name">${cfg.name}</div><div class="entity-income">📦 Накоплено: ${m.accumulated||0} ${cfg.resource}</div><div class="btn-row"><button class="collect-btn" onclick="collectMine()">📦 Собрать</button><button class="sell-btn" onclick="sellMine()">💸 Продать</button></div></div>`; }
function buyMine(id){const m=MINES[id];if(ST.coins<m.price)return;ST.coins-=m.price;ST.mine={id:id,level:1,accumulated:0,last_collect:now()};updateCoins();renderBusiness(document.getElementById('tabContent'));}
function collectMine(){if(!ST.mine)return;const cfg=MINES[ST.mine.id];const income=cfg.income;const elapsed=(now()-(ST.mine.last_collect||now()))/3600000;const earned=Math.floor(elapsed*income);if(earned<1){alert('⏳ Ещё нет!');return;}ST.coins+=earned*10;ST.mine.accumulated=0;ST.mine.last_collect=now();if(ST.resources[cfg.resource]!==undefined)ST.resources[cfg.resource]+=earned;updateCoins();renderBusiness(document.getElementById('tabContent'));}
function sellMine(){if(!ST.mine)return;ST.coins+=Math.floor(MINES[ST.mine.id].price*0.7);ST.mine=null;updateCoins();renderBusiness(document.getElementById('tabContent'));}

// БАНК
function bankDeposit() {
    const amt = parseInt(prompt('Сумма пополнения:', '100')) || 0;
    if (amt <= 0 || amt > ST.coins) { alert('❌ Неверная сумма!'); return; }
    ST.coins -= amt; ST.bank_deposit += amt;
    updateCoins(); sendToBot('bank_deposit', { amount: amt }); renderBusiness(document.getElementById('tabContent'));
}
function bankWithdraw() {
    const amt = parseInt(prompt('Сумма снятия:', '100')) || 0;
    if (amt <= 0 || amt > ST.bank_deposit) { alert('❌ Неверная сумма!'); return; }
    ST.coins += amt; ST.bank_deposit -= amt;
    updateCoins(); sendToBot('bank_withdraw', { amount: amt }); renderBusiness(document.getElementById('tabContent'));
}

// БИРЖА
function updateExchangePrices() {
    Object.keys(EXCHANGE).forEach(k => {
        const ex = EXCHANGE[k];
        ex.price = rnd(Math.floor(ex.price*0.8), Math.floor(ex.price*1.2));
        ex.price = Math.max(ex.min, Math.min(ex.max, ex.price));
    });
}

function renderExchange() {
    const el = document.getElementById('exchangeArea');
    if (!el) return;
    el.innerHTML = Object.entries(EXCHANGE).map(([id,ex]) => `
        <div class="shop-item">
            <div class="shop-info">
                <div class="shop-name">${ex.name}</div>
                <div class="shop-price">💰 ${ex.price} 🪙/шт | У вас: ${ST.resources[id]||0}</div>
            </div>
            <button class="buy-btn" onclick="sellResource('${id}')">Продать</button>
        </div>`).join('');
}

function sellResource(id) {
    const amount = parseInt(prompt(`Сколько ${EXCHANGE[id].name} продать?`, '1')) || 0;
    if (amount <= 0 || (ST.resources[id]||0) < amount) { alert('❌ Недостаточно ресурсов!'); return; }
    const price = EXCHANGE[id].price;
    const total = price * amount;
    const tax = Math.floor(total * 0.05);
    const earned = total - tax;
    ST.resources[id] -= amount;
    ST.coins += earned;
    updateCoins();
    sendToBot('sell_resource', { resource: id, amount, earned });
    alert(`✅ Продано ${amount} ${EXCHANGE[id].name} за ${earned} 🪙 (комиссия: ${tax})`);
    renderExchange();
}

// ============ ПРОФИЛЬ ============
function renderProfile(el) {
    el.innerHTML = `
        <div class="profile-card">
            <p>👤 <b>${ST.user.first_name || 'Игрок'}</b></p>
            <p>🎯 Уровень: <b>${ST.level}</b></p>
            <p>💰 Монеты: <b>${fmt(ST.coins)} 🪙</b></p>
            <p>💎 Кристаллы: <b>${ST.crystals}</b></p>
            <p>⚔️ Атака: <b>${ST.attack}</b> | 🛡 Защита: <b>${ST.defense}</b></p>
            <p>❤️ HP: <b>${ST.health}/${ST.max_health}</b></p>
            <p>🔮 Мана: <b>${ST.mana}/${ST.max_mana}</b></p>
            <p>⚡ Энергия: <b>${ST.energy}/${ST.max_energy}</b></p>
            <p>🏦 Депозит: <b>${fmt(ST.bank_deposit)} 🪙</b></p>
            <p>🛡 Экипировка: <b>${ST.equipment.weapon||'—'} / ${ST.equipment.armor||'—'}</b></p>
            <p>🎒 Предметов: <b>${Object.values(ST.inventory).reduce((a,b)=>a+b,0)}</b></p>
        </div>`;
}
