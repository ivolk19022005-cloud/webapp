// ============ МОДУЛЬ ИГР ============

import { state } from '../core/state.js';
import BotAPI from '../core/api.js';
import { formatNumber, random, showAlert, validateBet, getElement, getMineSweeperColor, getMineSweepNeighbors } from '../utils/formatters.js';
import { GAMES, SLOTS_SYMBOLS } from '../config/constants.js';

export class GamesModule {
    static renderGamesMenu(el) {
        const html = `
            <div class="card-grid">
                ${Object.entries(GAMES).map(([key, game]) => `
                    <div class="card" onclick="app.games.openGame('${key}')">
                        <div class="emoji">${game.emoji}</div>
                        <div class="title">${game.name}</div>
                        <div class="sub">${game.description}</div>
                    </div>
                `).join('')}
            </div>
            <div id="gameArea"></div>
        `;
        el.innerHTML = html;
    }

    static openGame(gameType) {
        const gameArea = getElement('gameArea');
        gameArea.innerHTML = '<button class="back-btn" onclick="app.games.closeGame()">← Назад к играм</button>';
        
        const content = document.createElement('div');
        
        switch(gameType) {
            case 'minesweeper': this.renderMinesweeper(content); break;
            case 'slots': this.renderSlots(content); break;
            case 'dice': this.renderDice(content); break;
            case 'coin': this.renderCoin(content); break;
            case 'roulette': this.renderRoulette(content); break;
            case 'va_bank': this.renderVaBank(content); break;
        }
        
        gameArea.appendChild(content);
    }

    static closeGame() {
        getElement('gameArea').innerHTML = '';
    }

    // ============ САПЁР ============
    static renderMinesweeper(el) {
        state.minesweeper = {
            board: [],
            size: 8,
            mines: 10,
            bet: 100,
            flags: 0,
            revealed: 0,
            gameOver: false
        };

        el.innerHTML = `
            <div class="ms-controls">
                <div class="ms-info">🚩 <span id="msFlags">0</span> 💣 <span id="msMines">10</span></div>
                <div class="ms-bet-group">
                    <input type="number" id="msBet" value="100" min="10">
                    <button class="buy-btn" onclick="app.games.setMsBet()">Ставка</button>
                </div>
                <div class="ms-difficulty">
                    <button class="active" data-s="8" data-m="10" onclick="app.games.changeMSDifficulty(this)">8×8</button>
                    <button data-s="10" data-m="15" onclick="app.games.changeMSDifficulty(this)">10×10</button>
                    <button data-s="12" data-m="20" onclick="app.games.changeMSDifficulty(this)">12×12</button>
                </div>
            </div>
            <div class="ms-board" id="msBoard"></div>
            <div id="msResult"></div>
            <button class="big-btn" id="msNewGame" onclick="app.games.startMinesweeper()" style="display:none;background:linear-gradient(135deg,#22c55e,#16a34a)">🔄 Новая игра</button>`;
        
        this.startMinesweeper();
    }

    static changeMSDifficulty(btn) {
        document.querySelectorAll('.ms-difficulty button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.minesweeper.size = +btn.dataset.s;
        state.minesweeper.mines = +btn.dataset.m;
        getElement('msMines').textContent = state.minesweeper.mines;
        this.startMinesweeper();
    }

    static startMinesweeper() {
        const ms = state.minesweeper;
        ms.gameOver = false;
        ms.flags = 0;
        ms.revealed = 0;
        ms.board = [];

        const resEl = getElement('msResult');
        const newBtn = getElement('msNewGame');
        if (resEl) resEl.innerHTML = '';
        if (newBtn) newBtn.style.display = 'none';

        const betInput = getElement('msBet');
        ms.bet = betInput ? (parseInt(betInput.value) || 100) : 100;

        // Генерация доски
        const total = ms.size * ms.size;
        const mineSet = new Set();
        while (mineSet.size < ms.mines) mineSet.add(Math.floor(Math.random() * total));

        for (let i = 0; i < total; i++) {
            ms.board.push({ mine: mineSet.has(i), revealed: false, flagged: false, adj: 0 });
        }

        for (let i = 0; i < total; i++) {
            if (!ms.board[i].mine) {
                ms.board[i].adj = getMineSweepNeighbors(i, ms.size).filter(n => ms.board[n].mine).length;
            }
        }

        this.renderMinesweeperBoard();
    }

    static renderMinesweeperBoard() {
        const ms = state.minesweeper;
        const el = getElement('msBoard');
        if (!el) return;

        el.style.gridTemplateColumns = `repeat(${ms.size}, 34px)`;
        el.innerHTML = '';

        ms.board.forEach((cell, i) => {
            const btn = document.createElement('button');
            btn.className = 'ms-cell';

            if (cell.revealed) {
                btn.classList.add('revealed');
                if (cell.mine) {
                    btn.classList.add('mine');
                    btn.textContent = '💣';
                } else if (cell.adj) {
                    btn.textContent = cell.adj;
                    btn.style.color = getMineSweeperColor(cell.adj);
                }
            } else if (cell.flagged) {
                btn.classList.add('flag');
                btn.textContent = '🚩';
            }

            btn.addEventListener('click', () => this.minesweeperClick(i));
            btn.addEventListener('contextmenu', e => { e.preventDefault(); this.minesweeperFlag(i); });

            el.appendChild(btn);
        });
    }

    static minesweeperClick(index) {
        const ms = state.minesweeper;
        if (ms.gameOver || ms.board[index].flagged || ms.board[index].revealed) return;

        this.minesweeperReveal(index);

        if (ms.board[index].mine) {
            this.endMinesweeper(false);
            return;
        }

        if (!ms.board[index].adj) {
            const queue = [index];
            const visited = new Set([index]);
            while (queue.length) {
                for (const neighbor of getMineSweepNeighbors(queue.shift(), ms.size)) {
                    if (visited.has(neighbor)) continue;
                    visited.add(neighbor);
                    if (!ms.board[neighbor].revealed && !ms.board[neighbor].flagged && !ms.board[neighbor].mine) {
                        this.minesweeperReveal(neighbor);
                        if (!ms.board[neighbor].adj) queue.push(neighbor);
                    }
                }
            }
        }

        if (ms.revealed === ms.size * ms.size - ms.mines) this.endMinesweeper(true);
        this.renderMinesweeperBoard();
    }

    static minesweeperReveal(index) {
        const ms = state.minesweeper;
        if (!ms.board[index].revealed) {
            ms.board[index].revealed = true;
            ms.revealed++;
        }
    }

    static minesweeperFlag(index) {
        const ms = state.minesweeper;
        if (ms.gameOver || ms.board[index].revealed) return;
        ms.board[index].flagged = !ms.board[index].flagged;
        ms.flags += ms.board[index].flagged ? 1 : -1;
        const el = getElement('msFlags');
        if (el) el.textContent = ms.flags;
        this.renderMinesweeperBoard();
    }

    static endMinesweeper(won) {
        const ms = state.minesweeper;
        ms.gameOver = true;
        ms.board.forEach(cell => { if (cell.mine) cell.revealed = true; });
        this.renderMinesweeperBoard();

        const el = getElement('msResult');
        const btn = getElement('msNewGame');

        if (won) {
            const reward = ms.bet * 2;
            state.addCoins(reward);
            if (el) {
                el.className = 'result win';
                el.innerHTML = `🎉 <b>ПОБЕДА!</b> +${formatNumber(reward)} 🪙`;
            }
            BotAPI.gameResult('minesweeper', true, ms.bet, reward);
        } else {
            state.subtractCoins(ms.bet);
            if (el) {
                el.className = 'result lose';
                el.innerHTML = `💥 <b>МИНА!</b> -${formatNumber(ms.bet)} 🪙`;
            }
            BotAPI.gameResult('minesweeper', false, ms.bet);
        }

        if (btn) btn.style.display = 'block';
        app.updateDisplay();
    }

    static setMsBet() {
        const input = getElement('msBet');
        if (!input) return;
        let v = parseInt(input.value);
        if (isNaN(v) || v < 10) v = 10;
        state.minesweeper.bet = v;
        input.value = v;
        this.startMinesweeper();
    }

    // ============ СЛОТЫ ============
    static renderSlots(el) {
        el.innerHTML = `
            <div class="slots-machine">
                <div class="slots-reels">
                    <div class="slot-reel" id="r0">🍒</div>
                    <div class="slot-reel" id="r1">🍊</div>
                    <div class="slot-reel" id="r2">🍋</div>
                </div>
                <div class="bet-input-group">
                    <label>�� Ставка:</label>
                    <input type="number" id="slotsBet" value="100" min="10">
                </div>
                <button class="big-btn" id="spinBtn" onclick="app.games.spinSlots()">🎰 КРУТИТЬ!</button>
                <div id="slotsResult"></div>
            </div>`;
    }

    static spinSlots() {
        if (state.slots.spinning) return;

        const betInput = getElement('slotsBet');
        const bet = betInput ? (parseInt(betInput.value) || 100) : 100;

        const validation = validateBet(bet, state.profile.coins);
        if (!validation.valid) { showAlert(validation.error); return; }

        state.subtractCoins(bet);
        app.updateDisplay();
        state.slots.spinning = true;

        const btn = getElement('spinBtn');
        if (btn) btn.disabled = true;

        const resEl = getElement('slotsResult');
        if (resEl) resEl.innerHTML = '';

        const reels = ['r0', 'r1', 'r2'].map(id => getElement(id));
        reels.forEach(r => { if (r) r.classList.add('spinning'); });

        let spins = 0;
        const interval = setInterval(() => {
            reels.forEach(r => { if (r) r.textContent = SLOTS_SYMBOLS[Math.floor(Math.random() * SLOTS_SYMBOLS.length)]; });
            spins++;

            if (spins >= 15) {
                clearInterval(interval);
                reels.forEach(r => { if (r) r.classList.remove('spinning'); });
                const symbols = reels.map(r => r ? r.textContent : '🍒');
                this.finishSlots(symbols, bet);
            }
        }, 80);
    }

    static finishSlots(symbols, bet) {
        const [a, b, c] = symbols;
        const el = getElement('slotsResult');
        if (!el) return;

        let reward = 0;
        let won = false;

        if (a === b && b === c) {
            won = true;
            const multipliers = { '💎': 10, '7️⃣': 7, '⭐': 3, '🔔': 5 };
            const mult = multipliers[a] || 1.5;
            reward = Math.floor(bet * mult);
            state.addCoins(reward);
            el.className = 'result win';
            el.innerHTML = `🎉 <b>ДЖЕКПОТ!</b> ${symbols.join('')}<br>+${formatNumber(reward)} 🪙`;
        } else if (a === b || b === c || a === c) {
            won = true;
            reward = Math.floor(bet * 1.2);
            state.addCoins(reward);
            el.className = 'result win';
            el.innerHTML = `👍 <b>Пара!</b> ${symbols.join('')}<br>+${formatNumber(reward)} 🪙`;
        } else {
            el.className = 'result lose';
            el.innerHTML = `😢 <b>Мимо!</b> ${symbols.join('')}<br>-${formatNumber(bet)} 🪙`;
        }

        BotAPI.gameResult('slots', won, bet, reward);
        state.slots.spinning = false;
        const btn = getElement('spinBtn');
        if (btn) btn.disabled = false;
        app.updateDisplay();
    }

    // ============ КУБИК ============
    static renderDice(el) {
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
                <button class="big-btn" onclick="app.games.playDice()">🎲 БРОСИТЬ!</button>
                <div id="diceResult"></div>
            </div>`;
    }

    static playDice() {
        const betInput = getElement('diceBet');
        const guessInput = getElement('diceGuess');
        const bet = betInput ? (parseInt(betInput.value) || 100) : 100;
        const guess = guessInput ? parseInt(guessInput.value) : 1;

        const validation = validateBet(bet, state.profile.coins);
        if (!validation.valid) { showAlert(validation.error); return; }

        state.subtractCoins(bet);
        app.updateDisplay();

        const roll = random(1, 6);
        const el = getElement('diceResult');
        let reward = 0;
        let won = false;

        if (roll === guess) {
            won = true;
            reward = bet * 6;
            state.addCoins(reward);
            if (el) {
                el.className = 'result win';
                el.innerHTML = `🎉 Выпало: <b>${roll}</b><br>+${formatNumber(reward)} 🪙`;
            }
        } else {
            if (el) {
                el.className = 'result lose';
                el.innerHTML = `😢 Выпало: <b>${roll}</b> (ваше: ${guess})<br>-${formatNumber(bet)} 🪙`;
            }
        }

        BotAPI.gameResult('dice', won, bet, reward);
        app.updateDisplay();
    }

    // ============ МОНЕТКА ============
    static renderCoin(el) {
        el.innerHTML = `
            <div class="slots-machine">
                <h2>🪙 Орёл или Решка</h2>
                <div class="bet-input-group">
                    <label>💰 Ставка:</label>
                    <input type="number" id="coinBet" value="100" min="10">
                </div>
                <div style="display:flex;gap:10px;margin:10px 0">
                    <button class="big-btn" style="background:#8b5cf6" onclick="app.games.playCoin('orel')">🦅 Орёл</button>
                    <button class="big-btn" style="background:#6366f1" onclick="app.games.playCoin('reshka')">👑 Решка</button>
                </div>
                <div id="coinResult"></div>
            </div>`;
    }

    static playCoin(choice) {
        const betInput = getElement('coinBet');
        const bet = betInput ? (parseInt(betInput.value) || 100) : 100;

        const validation = validateBet(bet, state.profile.coins);
        if (!validation.valid) { showAlert(validation.error); return; }

        state.subtractCoins(bet);
        app.updateDisplay();

        const result = ['orel', 'reshka'][random(0, 1)];
        const el = getElement('coinResult');
        let reward = 0;
        let won = false;

        if (choice === result) {
            won = true;
            reward = bet * 2;
            state.addCoins(reward);
            if (el) {
                el.className = 'result win';
                el.innerHTML = `🎉 <b>${result === 'orel' ? '🦅 Орёл' : '👑 Решка'}!</b><br>+${formatNumber(reward)} 🪙`;
            }
        } else {
            if (el) {
                el.className = 'result lose';
                el.innerHTML = `😢 <b>${result === 'orel' ? '🦅 Орёл' : '👑 Решка'}</b><br>-${formatNumber(bet)} 🪙`;
            }
        }

        BotAPI.gameResult('coin', won, bet, reward);
        app.updateDisplay();
    }

    // ============ РУЛЕТКА ============
    static renderRoulette(el) {
        el.innerHTML = `
            <div class="slots-machine">
                <h2>🎡 Рулетка</h2>
                <div class="bet-input-group">
                    <label>💰 Ставка:</label>
                    <input type="number" id="roulBet" value="100" min="10">
                </div>
                <button class="big-btn" onclick="app.games.playRoulette()">🎡 КРУТИТЬ!</button>
                <div id="roulResult"></div>
            </div>`;
    }

    static playRoulette() {
        const betInput = getElement('roulBet');
        const bet = betInput ? (parseInt(betInput.value) || 100) : 100;

        const validation = validateBet(bet, state.profile.coins);
        if (!validation.valid) { showAlert(validation.error); return; }

        state.subtractCoins(bet);
        app.updateDisplay();

        const roll = Math.random();
        const el = getElement('roulResult');
        let reward = 0;
        let won = false;

        if (roll < 0.3) {
            won = true;
            const mult = roll < 0.15 ? 1.5 : roll < 0.225 ? 2 : roll < 0.27 ? 3 : roll < 0.295 ? 5 : 10;
            reward = Math.floor(bet * mult);
            state.addCoins(reward);
            if (el) {
                el.className = 'result win';
                el.innerHTML = `🎉 <b>×${mult}!</b><br>+${formatNumber(reward)} 🪙`;
            }
        } else {
            if (el) {
                el.className = 'result lose';
                el.innerHTML = `😢 <b>Не повезло!</b><br>-${formatNumber(bet)} 🪙`;
            }
        }

        BotAPI.gameResult('roulette', won, bet, reward);
        app.updateDisplay();
    }

    // ============ ВА-БАНК ============
    static renderVaBank(el) {
        el.innerHTML = `
            <div class="slots-machine">
                <h2>💎 Ва-Банк</h2>
                <p style="color:#aaa">Ставка: весь баланс (${formatNumber(state.profile.coins)} 🪙)</p>
                <p style="color:#ffd700;margin:10px 0">50% — удвоить, 50% — потерять всё!</p>
                <button class="big-btn" style="background:linear-gradient(135deg,#ef4444,#dc2626)" onclick="app.games.playVaBank()">💎 ВА-БАНК!</button>
                <div id="vaResult"></div>
            </div>`;
    }

    static playVaBank() {
        const bet = state.profile.coins;
        if (bet <= 0) { showAlert('Нечего ставить!'); return; }

        state.profile.coins = 0;
        app.updateDisplay();

        const won = Math.random() < 0.5;
        const el = getElement('vaResult');
        let reward = 0;

        if (won) {
            reward = bet * 2;
            state.addCoins(reward);
            if (el) {
                el.className = 'result win';
                el.innerHTML = `🎉 <b>УДВОЕНИЕ!</b><br>+${formatNumber(reward)} 🪙`;
            }
        } else {
            if (el) {
                el.className = 'result lose';
                el.innerHTML = `💀 <b>ПОТЕРЯНО ВСЁ!</b><br>-${formatNumber(bet)} 🪙`;
            }
        }

        BotAPI.gameResult('va_bank', won, bet, reward);
        app.updateDisplay();
    }
}