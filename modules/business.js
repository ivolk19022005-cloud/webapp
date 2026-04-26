// ============ МОДУЛЬ БИЗНЕСА ============

import { state } from '../core/state.js';
import BotAPI from '../core/api.js';
import { random, showAlert, formatNumber, getElement } from '../utils/formatters.js';
import { BUSINESS_CONFIGS, EXCHANGE_PRICES } from '../config/constants.js';

export class BusinessModule {
    static renderBusiness(el) {
        let html = '';

        // Бизнес
        html += '<div class="section-title">💼 Бизнес</div>';
        if (state.business) {
            html += `
                <div class="entity-card">
                    <div class="entity-name">${state.business.name}</div>
                    <div class="entity-stats">⭐ Ур. ${state.business.level} | 📈 Доход: ${state.business.income}/ч</div>
                    <div class="entity-income">📦 Накоплено: ${state.business.accumulated || 0} 🪙</div>
                    <div class="btn-row">
                        <button class="collect-btn" onclick="app.business.collectBusiness()">💰 Собрать</button>
                        <button class="sell-btn" onclick="app.business.sellBusiness()">💸 Продать</button>
                    </div>
                </div>`;
        } else {
            const bizCfg = BUSINESS_CONFIGS.business;
            html += `
                <div class="shop-item">
                    <div class="shop-info">
                        <div class="shop-name">${bizCfg.name}</div>
                        <div class="shop-price">💰 ${bizCfg.price} 🪙 | 📈 ${bizCfg.income}/ч</div>
                    </div>
                    <button class="buy-btn" onclick="app.business.buyBusiness()">Купить</button>
                </div>`;
        }

        // Ферма
        html += '<div class="section-title">🚜 Ферма</div>';
        if (state.farm) {
            html += `
                <div class="entity-card">
                    <div class="entity-name">${state.farm.name}</div>
                    <div class="entity-income">📦 Накоплено: ${state.farm.accumulated || 0} ${state.farm.resource || ''}</div>
                    <div class="btn-row">
                        <button class="collect-btn" onclick="app.business.collectFarm()">📦 Собрать</button>
                        <button class="sell-btn" onclick="app.business.sellFarm()">💸 Продать</button>
                    </div>
                </div>`;
        } else {
            const farmCfg = BUSINESS_CONFIGS.farm;
            html += `
                <div class="shop-item">
                    <div class="shop-info">
                        <div class="shop-name">${farmCfg.name}</div>
                        <div class="shop-price">💰 ${farmCfg.price} 🪙 | 📈 ${farmCfg.income} пшеницы/ч</div>
                    </div>
                    <button class="buy-btn" onclick="app.business.buyFarm()">Купить</button>
                </div>`;
        }

        // Шахта
        html += '<div class="section-title">⛏️ Шахта</div>';
        if (state.mine) {
            html += `
                <div class="entity-card">
                    <div class="entity-name">${state.mine.name}</div>
                    <div class="entity-income">📦 Накоплено: ${state.mine.accumulated || 0} ${state.mine.resource || ''}</div>
                    <div class="btn-row">
                        <button class="collect-btn" onclick="app.business.collectMine()">📦 Собрать</button>
                        <button class="sell-btn" onclick="app.business.sellMine()">💸 Продать</button>
                    </div>
                </div>`;
        } else {
            const mineCfg = BUSINESS_CONFIGS.mine;
            html += `
                <div class="shop-item">
                    <div class="shop-info">
                        <div class="shop-name">${mineCfg.name}</div>
                        <div class="shop-price">💰 ${mineCfg.price} 🪙 | 📈 ${mineCfg.income} угля/ч</div>
                    </div>
                    <button class="buy-btn" onclick="app.business.buyMine()">Купить</button>
                </div>`;
        }

        // Банк
        html += '<div class="section-title">🏦 Банк (депозит: ' + formatNumber(state.profile.bankDeposit) + ' 🪙)</div>';
        html += `
            <div class="btn-row" style="margin-bottom:10px">
                <button class="collect-btn" onclick="app.business.bankDeposit()">💰 Пополнить</button>
                <button class="upgrade-btn" onclick="app.business.bankWithdraw()">💸 Снять</button>
            </div>`;

        // Биржа
        html += '<div class="section-title">📈 Биржа</div>';
        html += '<div id="exchangeArea"></div>';

        el.innerHTML = html;
        this.renderExchange();
    }

    static buyBusiness() {
        const cfg = BUSINESS_CONFIGS.business;
        if (state.profile.coins < cfg.price) {
            showAlert('❌ Недостаточно монет!');
            return;
        }
        state.subtractCoins(cfg.price);
        state.setBusiness({
            name: cfg.name,
            level: 1,
            income: cfg.income,
            accumulated: 0
        });
        app.updateDisplay();
        BotAPI.buyBusiness(1);
        showAlert('✅ Бизнес куплен!');
        this.renderBusiness(getElement('tabContent'));
    }

    static collectBusiness() {
        if (!state.business) return;
        const earned = random(80, 120);
        state.addCoins(earned);
        app.updateDisplay();
        BotAPI.collectBusiness(earned);
        showAlert(`✅ Собрано: +${earned} 🪙`);
        this.renderBusiness(getElement('tabContent'));
    }

    static sellBusiness() {
        if (!state.business) return;
        const cfg = BUSINESS_CONFIGS.business;
        state.addCoins(cfg.sell_price);
        state.clearBusiness();
        app.updateDisplay();
        BotAPI.sellBusiness(cfg.sell_price);
        showAlert(`💸 Бизнес продан за ${cfg.sell_price} 🪙`);
        this.renderBusiness(getElement('tabContent'));
    }

    static buyFarm() {
        const cfg = BUSINESS_CONFIGS.farm;
        if (state.profile.coins < cfg.price) {
            showAlert('❌ Недостаточно монет!');
            return;
        }
        state.subtractCoins(cfg.price);
        state.setFarm({
            name: cfg.name,
            resource: cfg.resource,
            income: cfg.income,
            accumulated: 0
        });
        app.updateDisplay();
        showAlert('✅ Ферма куплена!');
        this.renderBusiness(getElement('tabContent'));
    }

    static collectFarm() {
        if (!state.farm) return;
        const earned = random(8, 12);
        state.addResource(state.farm.resource, earned);
        state.addCoins(earned * 15);
        app.updateDisplay();
        showAlert(`✅ Собрано: +${earned} ${state.farm.resource}`);
        this.renderBusiness(getElement('tabContent'));
    }

    static sellFarm() {
        if (!state.farm) return;
        const cfg = BUSINESS_CONFIGS.farm;
        state.addCoins(cfg.sell_price);
        state.clearFarm();
        app.updateDisplay();
        showAlert(`💸 Ферма продана за ${cfg.sell_price} 🪙`);
        this.renderBusiness(getElement('tabContent'));
    }

    static buyMine() {
        const cfg = BUSINESS_CONFIGS.mine;
        if (state.profile.coins < cfg.price) {
            showAlert('❌ Недостаточно монет!');
            return;
        }
        state.subtractCoins(cfg.price);
        state.setMine({
            name: cfg.name,
            resource: cfg.resource,
            income: cfg.income,
            accumulated: 0
        });
        app.updateDisplay();
        showAlert('✅ Шахта куплена!');
        this.renderBusiness(getElement('tabContent'));
    }

    static collectMine() {
        if (!state.mine) return;
        const earned = random(4, 6);
        state.addResource(state.mine.resource, earned);
        state.addCoins(earned * 60);
        app.updateDisplay();
        showAlert(`✅ Собрано: +${earned} ${state.mine.resource}`);
        this.renderBusiness(getElement('tabContent'));
    }

    static sellMine() {
        if (!state.mine) return;
        const cfg = BUSINESS_CONFIGS.mine;
        state.addCoins(cfg.sell_price);
        state.clearMine();
        app.updateDisplay();
        showAlert(`💸 Шахта продана за ${cfg.sell_price} 🪙`);
        this.renderBusiness(getElement('tabContent'));
    }

    static bankDeposit() {
        const amt = parseInt(prompt('Сумма пополнения:', '100'));
        if (!amt || amt <= 0 || amt > state.profile.coins) {
            showAlert('❌ Неверная сумма!');
            return;
        }
        state.subtractCoins(amt);
        state.profile.bankDeposit += amt;
        app.updateDisplay();
        BotAPI.bankDeposit(amt);
        showAlert(`✅ Пополнено: +${amt} 🪙`);
        this.renderBusiness(getElement('tabContent'));
    }

    static bankWithdraw() {
        const amt = parseInt(prompt('Сумма снятия:', '100'));
        if (!amt || amt <= 0 || amt > state.profile.bankDeposit) {
            showAlert('❌ Неверная сумма!');
            return;
        }
        state.addCoins(amt);
        state.profile.bankDeposit -= amt;
        app.updateDisplay();
        BotAPI.bankWithdraw(amt);
        showAlert(`✅ Снято: +${amt} 🪙`);
        this.renderBusiness(getElement('tabContent'));
    }

    static renderExchange() {
        const el = getElement('exchangeArea');
        if (!el) return;

        el.innerHTML = Object.entries(EXCHANGE_PRICES).map(([id, data]) => `
            <div class="shop-item">
                <div class="shop-info">
                    <div class="shop-name">${data.name}</div>
                    <div class="shop-price">💰 ${data.price} 🪙/шт | У вас: ${state.getResource(id)}</div>
                </div>
                <button class="buy-btn" onclick="app.business.sellResource('${id}', ${data.price})">Продать</button>
            </div>
        `).join('');
    }

    static sellResource(id, price) {
        const amt = parseInt(prompt(`Сколько продать? (цена: ${price} 🪙/шт)`, '1'));
        if (!amt || amt <= 0 || state.getResource(id) < amt) {
            showAlert('❌ Недостаточно ресурсов!');
            return;
        }

        state.resources[id] -= amt;
        const earned = Math.floor(price * amt * 0.95);
        state.addCoins(earned);
        app.updateDisplay();
        BotAPI.sellResource(id, amt, earned);
        showAlert(`✅ Продано ${amt} шт. за ${earned} 🪙`);
        this.renderExchange();
    }
}