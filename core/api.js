// ============ API И КОММУНИКАЦИЯ С БОТОМ ============

const tg = window.Telegram.WebApp;

class BotAPI {
    static init() {
        tg.expand();
        tg.ready();
    }

    static sendData(action, data = {}) {
        try {
            tg.sendData(JSON.stringify({ action, timestamp: Date.now(), ...data }));
        } catch (err) {
            console.error('Failed to send data to bot:', err);
        }
    }

    static gameResult(game, won, bet, reward = 0) {
        this.sendData('game_result', {
            game,
            win: won,
            bet,
            reward
        });
    }

    static adventureComplete(advType, coins, energy) {
        this.sendData('adventure_complete', {
            adv_type: advType,
            coins,
            energy
        });
    }

    static bossAttack(damage, coins, killed) {
        this.sendData('boss_attack', {
            damage,
            coins,
            killed
        });
    }

    static buyItem(category, itemId, price, currency, itemName) {
        this.sendData('buy_item', {
            category,
            item_id: itemId,
            price,
            currency,
            item_name: itemName
        });
    }

    static equipItem(slot, itemName) {
        this.sendData('equip_item', {
            slot,
            item_name: itemName
        });
    }

    static usePotion(itemName) {
        this.sendData('use_potion', {
            item_name: itemName
        });
    }

    static buyBusiness(bizId) {
        this.sendData('buy_business', { biz_id: bizId });
    }

    static collectBusiness(income) {
        this.sendData('biz_collect', { income });
    }

    static sellBusiness(refund) {
        this.sendData('sell_business', { refund });
    }

    static bankDeposit(amount) {
        this.sendData('bank_deposit', { amount });
    }

    static bankWithdraw(amount) {
        this.sendData('bank_withdraw', { amount });
    }

    static sellResource(resource, amount, earned) {
        this.sendData('sell_resource', {
            resource,
            amount,
            earned
        });
    }

    static getUserName() {
        return tg.initDataUnsafe?.user?.first_name || 'Игрок';
    }

    static setMainButton(text, callback) {
        tg.MainButton.setText(text);
        tg.MainButton.onClick(callback);
        tg.MainButton.show();
    }

    static close() {
        tg.close();
    }
}

export default BotAPI;