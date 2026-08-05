// ========================================
// CURRENCY UTILITIES
// ========================================

const CurrencyUtils = {
    symbols: {
        EUR: '€',
        USD: '$',
        GBP: '£',
        CHF: 'CHF',
        CAD: 'CA$',
        JPY: '¥'
    },

    currentCurrency: 'EUR',

    format(amount, currency = null) {
        const curr = currency || this.currentCurrency;
        const symbol = this.symbols[curr] || curr;
        const absAmount = Math.abs(amount);

        let formatted;
        if (curr === 'JPY') {
            formatted = Math.round(absAmount).toLocaleString('fr-FR');
        } else {
            formatted = absAmount.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        return `${amount < 0 ? '-' : ''}${formatted} ${symbol}`;
    },

    formatSigned(amount, type) {
        const formatted = this.format(Math.abs(amount));
        if (type === 'income') return `+${formatted}`;
        if (type === 'expense') return `-${formatted}`;
        return formatted;
    },

    getSymbol(currency = null) {
        const curr = currency || this.currentCurrency;
        return this.symbols[curr] || curr;
    }
};
