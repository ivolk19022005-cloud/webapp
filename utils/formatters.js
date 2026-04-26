// ============ УТИЛИТЫ И ФОРМАТИРОВАНИЕ ============

// Форматирование больших чисел
export function formatNumber(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'М';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'К';
    return String(n);
}

// Случайное число
export function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Получить текущее время
export function now() {
    return Date.now();
}

// Форматирование времени кулдауна
export function formatCooldown(seconds) {
    if (seconds <= 0) return ''; 
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;
}

// Валидация ставки
export function validateBet(bet, availableCoins, minBet = 10) {
    if (isNaN(bet) || bet < minBet) {
        return { valid: false, error: `Минимальная ставка: ${minBet} 🪙` };
    }
    if (bet > availableCoins) {
        return { valid: false, error: 'Недостаточно монет!' };
    }
    return { valid: true };
}

// Валидация суммы
export function validateAmount(amount, available) {
    if (isNaN(amount) || amount <= 0) {
        return { valid: false, error: 'Неверная сумма!' };
    }
    if (amount > available) {
        return { valid: false, error: 'Недостаточно средств!' };
    }
    return { valid: true };
}

// Получить соседей в сапёре
export function getMineSweepNeighbors(index, boardSize) {
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    const neighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                neighbors.push(nr * boardSize + nc);
            }
        }
    }
    return neighbors;
}

// Определить цвет для числа в сапёре
export function getMineSweeperColor(number) {
    const colors = ['', '#4ade80', '#facc15', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#14b8a6'];
    return colors[number] || '#fff';
}

// Безопасное получение элемента
export function getElement(id) {
    return document.getElementById(id);
}

// Показать оповещение с эмодзи и стилем
export function showAlert(message) {
    // Используем встроенный alert или можно создать кастомное уведомление
    alert(message);
}

// Копировать в буфер обмена
export function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => console.error('Ошибка копирования:', err));
}