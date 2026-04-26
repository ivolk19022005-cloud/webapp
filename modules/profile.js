// ============ МОДУЛЬ ПРОФИЛЯ ============

import { state } from '../core/state.js';
import BotAPI from '../core/api.js';
import { formatNumber, getElement } from '../utils/formatters.js';

export class ProfileModule {
    static renderProfile(el) {
        const p = state.profile;
        const totalItems = state.getTotalItems();

        el.innerHTML = `
            <div class="profile-card">
                <div class="profile-header">
                    <h2>👤 ${BotAPI.getUserName()}</h2>
                    <div class="profile-badges">
                        <span class="badge">🎯 Уровень ${p.level}</span>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>💰 Финансы</h3>
                    <div class="stat-row">
                        <span>Монеты:</span>
                        <strong>${formatNumber(p.coins)} 🪙</strong>
                    </div>
                    <div class="stat-row">
                        <span>Кристаллы:</span>
                        <strong>${p.crystals} 💎</strong>
                    </div>
                    <div class="stat-row">
                        <span>Банк:</span>
                        <strong>${formatNumber(p.bankDeposit)} 🪙</strong>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>⚔️ Характеристики</h3>
                    <div class="stat-row">
                        <span>Атака:</span>
                        <strong>${p.attack}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Защита:</span>
                        <strong>${p.defense}</strong>
                    </div>
                    <div class="stat-bar">
                        <span>❤️ HP:</span>
                        <div class="bar">
                            <div class="bar-fill" style="width:${(p.health / p.maxHealth * 100)}%; background:#ef4444"></div>
                        </div>
                        <span>${p.health}/${p.maxHealth}</span>
                    </div>
                    <div class="stat-bar">
                        <span>🔮 Мана:</span>
                        <div class="bar">
                            <div class="bar-fill" style="width:${(p.mana / p.maxMana * 100)}%; background:#8b5cf6"></div>
                        </div>
                        <span>${p.mana}/${p.maxMana}</span>
                    </div>
                    <div class="stat-bar">
                        <span>⚡ Энергия:</span>
                        <div class="bar">
                            <div class="bar-fill" style="width:${(p.energy / p.maxEnergy * 100)}%; background:#22c55e"></div>
                        </div>
                        <span>${p.energy}/${p.maxEnergy}</span>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>🛡 Экипировка</h3>
                    <div class="equipment">
                        <div class="equip-slot">
                            <span>⚔️ Оружие:</span>
                            <strong>${state.equipment.weapon || '—'}</strong>
                        </div>
                        <div class="equip-slot">
                            <span>🛡 Броня:</span>
                            <strong>${state.equipment.armor || '—'}</strong>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>🎒 Инвентарь</h3>
                    <div class="stat-row">
                        <span>Предметов:</span>
                        <strong>${totalItems} шт.</strong>
                    </div>
                </div>
            </div>`;
    }
}