// ========================================
// MAIN APP
// ========================================

class CashewApp {
    constructor() {
        this.db = new CashewDB();
        this.router = new Router();
        this.categories = new CategoriesManager();
        this.transactions = new TransactionsManager();
        this.budgets = new BudgetsManager();
        this.stats = new StatsManager();
        this.settings = new SettingsManager();
    }

    async init() {
        try {
            // Init DB
            await this.db.init();

            // Init categories (defaults)
            await this.categories.init();

            // Load settings
            await this.settings.loadSettings();

            // Init components
            this.router.init();
            this.transactions.init();
            this.budgets.init();
            this.stats.init();
            this.settings.init();

            // Load home
            await this.loadHome();

            // Hide splash
            setTimeout(() => {
                document.getElementById('splash-screen').classList.add('hide');
                document.getElementById('main-app').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('splash-screen').style.display = 'none';
                }, 500);
            }, 800);

        } catch (err) {
            console.error('Init error:', err);
            document.getElementById('splash-screen').innerHTML = `
                <div class="splash-content">
                    <div class="splash-icon">⚠️</div>
                    <h1>Erreur</h1>
                    <p>${err.message}</p>
                </div>`;
        }
    }

    async loadHome() {
        const transactions = await this.db.getAll('transactions');

        // Current month
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));

        const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;

        // All time balance
        const allIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const allExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const totalBalance = allIncome - allExpenses;

        document.getElementById('total-balance').textContent = CurrencyUtils.format(totalBalance);
        document.getElementById('total-income').textContent = CurrencyUtils.format(income);
        document.getElementById('total-expenses').textContent = CurrencyUtils.format(expenses);

        const changeIcon = balance >= 0 ? 'trending_up' : 'trending_down';
        const changeText = `${balance >= 0 ? '+' : ''}${CurrencyUtils.format(balance)} ce mois`;
        document.getElementById('balance-change').innerHTML = `
            <span class="material-icons-round">${changeIcon}</span>
            <span>${changeText}</span>`;

        // Budget overview
        await this.budgets.loadOverview();

        // Recent transactions
        await this.transactions.loadRecent(5);

        // Donut chart
        this.drawHomeChart(monthTransactions.filter(t => t.type === 'expense'));
    }

    drawHomeChart(expenses) {
        const categoryTotals = {};
        expenses.forEach(tx => {
            const key = tx.categoryName || 'Autre';
            if (!categoryTotals[key]) {
                categoryTotals[key] = { value: 0, color: tx.categoryColor || '#94a3b8' };
            }
            categoryTotals[key].value += tx.amount;
        });

        const data = Object.entries(categoryTotals)
            .sort((a, b) => b[1].value - a[1].value)
            .map(([name, { value, color }]) => ({ name, value, color }));

        Charts.drawDonut('donut-chart', data);

        // Legend
        const legend = document.getElementById('category-legend');
        const total = data.reduce((s, d) => s + d.value, 0);

        if (data.length === 0) {
            legend.innerHTML = '<p class="no-data-hint">Pas de dépenses ce mois</p>';
            return;
        }

        legend.innerHTML = data.slice(0, 6).map(d => `
            <div class="legend-item">
                <div class="legend-dot" style="background:${d.color}"></div>
                <span class="legend-label">${d.name}</span>
                <span class="legend-value">${Math.round((d.value / total) * 100)}%</span>
            </div>
        `).join('');
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showToast(message, duration = 2500) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    async exportData() {
        try {
            const data = await this.db.exportAll();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `cashew_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showToast('Données exportées');
        } catch (e) {
            this.showToast('Erreur lors de l\'export');
            console.error(e);
        }
    }

    async clearAllData() {
        if (!confirm('Supprimer TOUTES les données ? Cette action est irréversible.')) return;
        if (!confirm('Êtes-vous vraiment sûr ?')) return;

        await this.db.clear('transactions');
        await this.db.clear('budgets');
        await this.db.clear('categories');
        await this.categories.init(); // Re-init defaults
        this.showToast('Toutes les données ont été supprimées');
        this.loadHome();
    }
}

// ========================================
// INIT
// ========================================
const app = new CashewApp();
document.addEventListener('DOMContentLoaded', () => app.init());

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('SW registration failed:', err);
        });
    });
}
