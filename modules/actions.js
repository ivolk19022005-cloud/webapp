// ============ МОДУЛЬ ДЕЙСТВИЙ (ПРИКЛЮЧЕНИЯ И БОССЫ) ============

import { state } from '../core/state.js';
import BotAPI from '../core/api.js';
import { formatNumber, random, showAlert, formatCooldown, now, getElement } from '../utils/formatters.js';
import { ADVENTURES, BOSSES } from '../config/constants.js';

export class ActionsModule {
    static renderActions(el) {
        let html = '<div class="section-title">⚔️ Приключения</div><div class="adventure-list">';

        Object.entries(ADVENTURES).forEach(([key, adv]) => {
            const cdKey = 'adv_' + key;
            const cooldownLeft = state.getCooldown(cdKey);
            const onCD = cooldownLeft > 0;
            const canDo = state.profile.energy >= adv.energy && state.profile.level >= adv.min_level && !onCD;

            html += `
                <div class="adv-card">
                    <div class="adv-info">
                        <div class="adv-name">${adv.name}</div>
                        <div class="adv-desc">⚡${adv.energy} энергии | 🎯Ур.${adv.min_level}+ | ⏳КД ${adv.cd}с</div>
                        <div class="adv-reward">💰${adv.reward[0]}-${adv.reward[1]} 🪙</div>
                        ${onCD ? `<div style=\"color:#f87171;font-size:11px\">⏳ КД: ${formatCooldown(cooldownLeft)}</div>` : ''}
                    </div>
                    <button class="go-btn" ${canDo ? '' : 'disabled'} onclick="app.actions.doAdventure('${key}', ${adv.energy}, ${adv.reward[0]}, ${adv.reward[1]}, ${adv.cd})">▶ Идти</button>
                </div>`;
        });

        html += '</div>';

        // Босс
        if (!state.boss.name) this.spawnBoss();

        html += `
            <div class="section-title">👹 Босс</div>
            <div class="boss-card">
                <div class="boss-name">${state.boss.name}</div>
                <div class="boss-type">${state.boss.type}</div>
                <div class="hp-bar-container">
                    <div class="hp-bar" style="width:${state.boss.maxHP > 0 ? (state.boss.hp / state.boss.maxHP * 100) : 0}%"></div>
                </div>
                <div style="margin:5px 0">❤️ ${state.boss.hp}/${state.boss.maxHP}</div>
                <div class="boss-actions">
                    <button class="attack-btn" onclick="app.actions.attackBoss()">⚔️ Атаковать</button>
                </div>
                <div id="bossResult"></div>
            </div>`;

        el.innerHTML = html;
    }

    static doAdventure(key, cost, minRew, maxRew, cd) {
        if (state.profile.energy < cost) {
            showAlert('❌ Недостаточно энергии!');
            return;
        }

        state.subtractEnergy(cost);
        const earned = random(minRew, maxRew);
        state.addCoins(earned);
        state.setCooldown('adv_' + key, cd * 1000);

        app.updateDisplay();
        BotAPI.adventureComplete(key, earned, cost);
        showAlert(`✅ Приключение завершено!\n💰 +${earned} 🪙`);
        this.renderActions(getElement('tabContent'));
    }

    static spawnBoss() {
        const boss = BOSSES[random(0, BOSSES.length - 1)];
        state.boss.name = boss.name;
        state.boss.type = boss.type;
        state.boss.hp = random(boss.hp[0], boss.hp[1]);
        state.boss.maxHP = state.boss.hp;
    }

    static attackBoss() {
        if (state.boss.hp <= 0) {
            this.spawnBoss();
            this.renderActions(getElement('tabContent'));
            return;
        }

        const cdKey = 'boss_hit';
        const cooldownLeft = state.getCooldown(cdKey);
        if (cooldownLeft > 0) {
            getElement('bossResult').innerHTML = `<div class=\"result info\">⏳ КД: ${formatCooldown(cooldownLeft)}</div>`;
            return;
        }

        state.setCooldown(cdKey, 600000); // 10 минут

        const dmg = random(Math.floor(state.profile.attack * 0.8), state.profile.attack);
        state.boss.hp -= dmg;
        if (state.boss.hp < 0) state.boss.hp = 0;

        const earned = random(10, 100) + state.profile.attack;
        state.addCoins(earned);
        app.updateDisplay();

        const killed = state.boss.hp <= 0;
        const resEl = getElement('bossResult');

        if (killed) {
            const bonusCoins = random(3000, 8000);
            state.addCoins(bonusCoins);
            if (resEl) {
                resEl.className = 'result win';
                resEl.innerHTML = `🎉 <b>БОСС УБИТ!</b><br>⚔️ ${dmg} урона<br>💰 +${formatNumber(earned + bonusCoins)} 🪙`;
            }
            BotAPI.bossAttack(dmg, earned + bonusCoins, true);
        } else {
            if (resEl) {
                resEl.className = 'result info';
                resEl.innerHTML = `⚔️ <b>-${dmg}</b> HP! +${formatNumber(earned)} 🪙`;
            }
            BotAPI.bossAttack(dmg, earned, false);
        }

        app.updateDisplay();

        if (killed) {
            setTimeout(() => {
                this.spawnBoss();
                this.renderActions(getElement('tabContent'));
            }, 2000);
        } else {
            this.renderActions(getElement('tabContent'));
        }
    }
}