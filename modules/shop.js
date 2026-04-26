// ============ МОДУЛЬ МАГАЗИНА И ИНВЕНТАРЯ ============

import { state } from '../core/state.js';
import BotAPI from '../core/api.js';
import { showAlert, getElement } from '../utils/formatters.js';
import { SHOP_DATA } from '../config/constants.js';

export class ShopModule {
    static renderShop(el) {
        let html = '<div class="section-title">🛒 Категории</div>';
        html += '<div class="quick-actions">';
        html += '<button class="action-btn" onclick="app.shop.showCategory(\'weapons\')"><span class="emoji">⚔️</span>Оружие</button>';
        html += '<button class="action-btn" onclick="app.shop.showCategory(\'armor\')"><span class="emoji">🛡</span>Броня</button>';
        html += '<button class="action-btn" onclick="app.shop.showCategory(\'potions\')"><span class="emoji">🧪</span>Зелья</button>';
        html += '</div>';
        html += '<div id="shopItems"></div>';
        html += '<hr style="border-color:rgba(255,255,255,.1);margin:10px 0">';
        html += '<div class="section-title">🎒 Инвентарь</div>';
        html += '<div id="invItems"></div>';

        el.innerHTML = html;
        this.showCategory('weapons');
        this.renderInventory();
    }

    static showCategory(category) {
        const items = SHOP_DATA[category];
        if (!items) return;

        const el = getElement('shopItems');
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
                <button class="buy-btn" onclick="app.shop.buyItem('${category}', '${id}', ${item.price}, '${item.currency}', '${item.name}')">Купить</button>
            </div>
        `).join('');
    }

    static buyItem(category, id, price, currency, name) {
        if (currency === 'crystals' && state.profile.crystals < price) {
            showAlert('❌ Недостаточно кристаллов!');
            return;
        }
        if (currency === 'coins' && state.profile.coins < price) {
            showAlert('❌ Недостаточно монет!');
            return;
        }

        if (currency === 'crystals') state.profile.crystals -= price;
        else state.subtractCoins(price);

        state.addItem(name);
        app.updateDisplay();
        BotAPI.buyItem(category, id, price, currency, name);
        showAlert(`✅ Куплено: ${name}!`);
        this.renderInventory();
    }

    static renderInventory() {
        const el = getElement('invItems');
        if (!el) return;

        const items = Object.entries(state.inventory).filter(([_, c]) => c > 0);

        if (!items.length) {
            el.innerHTML = '<div class="empty">📭 Инвентарь пуст</div>';
            return;
        }

        el.innerHTML = items.map(([name, count]) => {
            let btn = '';
            if (name.includes('Зелье')) {
                btn = `<button class="use-btn" onclick="app.shop.useItem('${name}')">🧪 Исп.</button>`;
            } else if (name.includes('меч') || name.includes('Меч') || name.includes('посох')) {
                btn = `<button class="equip-btn" onclick="app.shop.equipItem('weapon', '${name}')">⚔️ Надеть</button>`;
            } else if (name.includes('доспех') || name.includes('Кольчуга') || name.includes('латы') || name.includes('мантия')) {
                btn = `<button class="equip-btn" onclick="app.shop.equipItem('armor', '${name}')">🛡 Надеть</button>`;
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

    static useItem(name) {
        if (!state.removeItem(name)) return;

        if (name.includes('здоровья')) state.addHealth(30);
        else if (name.includes('маны')) state.profile.mana = Math.min(state.profile.maxMana, state.profile.mana + 25);
        else if (name.includes('энергии')) state.addEnergy(20);

        app.updateDisplay();
        BotAPI.usePotion(name);
        showAlert(`✅ Использовано: ${name}!`);
        this.renderInventory();
    }

    static equipItem(slot, name) {
        const old = state.equipment[slot];
        if (old) state.addItem(old);

        state.equipment[slot] = name;
        state.removeItem(name);

        app.updateDisplay();
        BotAPI.equipItem(slot, name);
        showAlert(`✅ Надето: ${name}!`);
        this.renderInventory();
    }
}