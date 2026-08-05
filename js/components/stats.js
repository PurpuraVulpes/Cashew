// ========================================
// STATS COMPONENT
// ========================================

class StatsManager {
    constructor() {
        this.currentPeriod = 'month';
    }

    init() {
        document.querySelectorAll('#stats-period .period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#stats-period .period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.load();
            });
        });
    }

    async load() {
        const transactions = await app.db.getAll('transactions');
        const filtered = app.transactions.filterByPeriod(transactions, this.currentPeriod);
        const expenses = filtered.filter(t => t.type === 'expense');

        // Stats cards
        const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
        const biggest = expenses.length > 0 ? Math.max(...expenses.map(t => t.amount)) : 0;

        let days;
        const now = new Date();
        switch (this.currentPeriod) {
            case 'week': days = 7; break;
            case 'month': days = now.getDate(); break;
            case 'year':
                const start = new Date(now.getFullYear(), 0, 1);
                days = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
                break;
            default: days = 30;
        }

        document.getElementById('stat-total-spent').textContent = CurrencyUtils.format(totalSpent);
        document.getElementById('stat-avg-day').textContent = CurrencyUtils.format(days > 0 ? totalSpent / days : 0);
        document.getElementById('stat-biggest').textContent = CurrencyUtils.format(biggest);
        document.getElementById('stat-count').textContent = expenses.length.toString();

        // Line chart
        this.drawLineChart(expenses);

        // Bar chart
        this.drawBarChart(expenses);

        // Top categories
        this.drawTopCategories(expenses);
    }

    drawLineChart(expenses) {
        const grouped = {};
        expenses.forEach(tx => {
            const key = tx.date;
            grouped[key] = (grouped[key] || 0) + tx.amount;
        });

        const dates = Object.keys(grouped).sort();
        if (dates.length === 0) {
            dates.push(new Date().toISOString().split('T')[0]);
            grouped[dates[0]] = 0;
        }

        // Fill missing dates
        const allDates = [];
        const allValues = [];

        if (dates.length > 1) {
            const start = new Date(dates[0]);
            const end = new Date(dates[dates.length - 1]);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const key = d.toISOString().split('T')[0];
                allDates.push(d.getDate().toString());
                allValues.push(grouped[key] || 0);
            }
        } else {
            allDates.push(dates[0].split('-')[2]);
            allValues.push(grouped[dates[0]]);
        }

        // Cumulative
        const cumulative = [];
        let sum = 0;
        allValues.forEach(v => {
            sum += v;
            cumulative.push(sum);
        });

        Charts.drawLine('line-chart', allDates, [
            { data: cumulative, color: '#dc2626', label: 'Cumul' }
        ]);
    }

    drawBarChart(expenses) {
        const categoryTotals = {};
        expenses.forEach(tx => {
            const name = tx.categoryName || 'Autre';
            categoryTotals[name] = (categoryTotals[name] || { total: 0, color: tx.categoryColor }) ;
            categoryTotals[name].total += tx.amount;
        });

        const sorted = Object.entries(categoryTotals)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 8);

        const labels = sorted.map(([name]) => name);
        const data = sorted.map(([, val]) => val.total);
        const colors = sorted.map(([, val]) => val.color);

        if (labels.length === 0) {
            labels.push('Aucune');
            data.push(0);
            colors.push('#94a3b8');
        }

        Charts.drawBar('bar-chart', labels, data, colors);
    }

    drawTopCategories(expenses) {
        const container = document.getElementById('top-categories');
        const categoryTotals = {};

        expenses.forEach(tx => {
            const key = tx.categoryId || 'other';
            if (!categoryTotals[key]) {
                categoryTotals[key] = {
                    name: tx.categoryName || 'Autre',
                    icon: tx.categoryIcon || 'more_horiz',
                    color: tx.categoryColor || '#94a3b8',
                    total: 0
                };
            }
            categoryTotals[key].total += tx.amount;
        });

        const sorted = Object.values(categoryTotals).sort((a, b) => b.total - a.total);
        const maxTotal = sorted.length > 0 ? sorted[0].total : 1;

        container.innerHTML = '<h3>Top catégories</h3>';

        if (sorted.length === 0) {
            container.innerHTML += '<p class="no-data-hint">Pas encore de données</p>';
            return;
        }

        container.innerHTML += sorted.slice(0, 6).map((cat, i) => `
            <div class="top-category-item">
                <div class="top-category-rank">${i + 1}</div>
                <div class="category-manager-icon" style="background:${cat.color};width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white">
                    <span class="material-icons-round" style="font-size:18px">${cat.icon}</span>
                </div>
                <span style="font-weight:600;font-size:13px;min-width:70px">${cat.name}</span>
                <div class="top-category-bar">
                    <div class="top-category-bar-fill" style="width:${(cat.total / maxTotal) * 100}%;background:${cat.color}"></div>
                </div>
                <span class="top-category-amount">${CurrencyUtils.format(cat.total)}</span>
            </div>
        `).join('');
    }
}
