// ========================================
// BUDGETS COMPONENT
// ========================================

class BudgetsManager {
    constructor() {
        this.currentPeriod = 'month';
    }

    init() {
        document.querySelectorAll('#budget-period .period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#budget-period .period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.loadAll();
            });
        });

        document.getElementById('btn-add-budget').addEventListener('click', () => this.openModal());
        document.getElementById('btn-save-budget').addEventListener('click', () => this.save());

        // Color & icon selectors in modal
        this.initModalSelectors();
    }

    initModalSelectors() {
        document.querySelectorAll('#budget-color-options .color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('#budget-color-options .color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            });
        });

        document.querySelectorAll('#budget-icon-selector .icon-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#budget-icon-selector .icon-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
            });
        });
    }

    async loadAll() {
        const budgets = await app.db.getAll('budgets');
        const transactions = await app.db.getAll('transactions');
        const container = document.getElementById('budgets-list');

        const filteredBudgets = budgets.filter(b => b.period === this.currentPeriod);

        if (filteredBudgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">account_balance_wallet</span>
                    <p>Aucun budget</p>
                    <p style="font-size:12px;margin-top:4px">Créez un budget pour suivre vos dépenses</p>
                </div>`;
            return;
        }

        container.innerHTML = filteredBudgets.map(budget => {
            const spent = this.calculateSpent(budget, transactions);
            const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
            const remaining = budget.amount - spent;
            const isOver = remaining < 0;

            let barColor = budget.color || 'var(--primary)';
            if (percentage > 90) barColor = 'var(--danger)';
            else if (percentage > 70) barColor = 'var(--warning)';

            const periodLabel = { week: 'Hebdo', month: 'Mensuel', year: 'Annuel' }[budget.period] || '';

            return `
                <div class="budget-card" data-id="${budget.id}">
                    <div class="budget-header">
                        <div class="budget-header-left">
                            <div class="budget-icon" style="background:${budget.color || 'var(--primary)'}">
                                <span class="material-icons-round">${budget.icon || 'account_balance_wallet'}</span>
                            </div>
                            <div>
                                <div class="budget-name">${budget.name}</div>
                                <div class="budget-period">${periodLabel}</div>
                            </div>
                        </div>
                        <div class="budget-amounts">
                            <div class="budget-spent">${CurrencyUtils.format(spent)}</div>
                            <div class="budget-limit">sur ${CurrencyUtils.format(budget.amount)}</div>
                        </div>
                    </div>
                    <div class="budget-bar">
                        <div class="budget-fill" style="width:${percentage}%;background:${barColor}"></div>
                    </div>
                    <div class="budget-footer">
                        <span class="budget-remaining ${isOver ? 'over' : ''}">${isOver ? 'Dépassé de ' + CurrencyUtils.format(Math.abs(remaining)) : 'Reste ' + CurrencyUtils.format(remaining)}</span>
                        <span>${Math.round(percentage)}%</span>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.budget-card').forEach(card => {
            card.addEventListener('click', () => this.openModal(card.dataset.id));
        });
    }

    async loadOverview() {
        const budgets = await app.db.getAll('budgets');
        const transactions = await app.db.getAll('transactions');
        const container = document.getElementById('budget-overview');

        const monthBudgets = budgets.filter(b => b.period === 'month').slice(0, 5);

        if (monthBudgets.length === 0) {
            container.innerHTML = `
                <div class="budget-card-mini" onclick="app.router.navigate('budgets')">
                    <div style="text-align:center;padding:8px;color:var(--text-secondary)">
                        <span class="material-icons-round" style="font-size:32px;display:block;margin-bottom:8px">add_circle_outline</span>
                        <span style="font-size:12px">Créer un budget</span>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = monthBudgets.map(budget => {
            const spent = this.calculateSpent(budget, transactions);
            const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
            let barColor = budget.color || 'var(--primary)';
            if (percentage > 90) barColor = 'var(--danger)';
            else if (percentage > 70) barColor = 'var(--warning)';

            return `
                <div class="budget-card-mini" onclick="app.router.navigate('budgets')">
                    <div class="budget-mini-header">
                        <div class="budget-mini-icon" style="background:${budget.color || 'var(--primary)'}">
                            <span class="material-icons-round">${budget.icon || 'account_balance_wallet'}</span>
                        </div>
                        <span class="budget-mini-name">${budget.name}</span>
                    </div>
                    <div class="budget-mini-bar">
                        <div class="budget-mini-fill" style="width:${percentage}%;background:${barColor}"></div>
                    </div>
                    <div class="budget-mini-info">
                        <span><strong>${CurrencyUtils.format(spent)}</strong></span>
                        <span>/ ${CurrencyUtils.format(budget.amount)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateSpent(budget, transactions) {
        const now = new Date();
        let startDate;

        switch (budget.period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const startStr = startDate.toISOString().split('T')[0];
        const categoryIds = budget.categoryIds || [];

        return transactions
            .filter(tx =>
                tx.type === 'expense' &&
                tx.date >= startStr &&
                (categoryIds.length === 0 || categoryIds.includes(tx.categoryId))
            )
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    async openModal(editId = null) {
        const title = document.getElementById('modal-budget-title');
        const deleteBtn = document.getElementById('btn-delete-budget');

        if (editId) {
            const budget = await app.db.get('budgets', editId);
            if (!budget) return;

            title.textContent = 'Modifier le budget';
            document.getElementById('budget-id').value = budget.id;
            document.getElementById('budget-name').value = budget.name;
            document.getElementById('budget-amount').value = budget.amount;
            document.getElementById('budget-period-select').value = budget.period;

            // Color
            document.querySelectorAll('#budget-color-options .color-dot').forEach(dot => {
                dot.classList.toggle('active', dot.dataset.color === budget.color);
            });

            // Icon
            document.querySelectorAll('#budget-icon-selector .icon-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.icon === budget.icon);
            });

            // Categories
            await app.categories.renderSelector('budget-categories', 'expense', budget.categoryIds || [], true);

            deleteBtn.classList.remove('hidden');
            deleteBtn.onclick = async () => {
                if (confirm('Supprimer ce budget ?')) {
                    await app.db.delete('budgets', editId);
                    app.closeModal('modal-budget');
                    this.loadAll();
                    app.showToast('Budget supprimé');
                }
            };
        } else {
            title.textContent = 'Nouveau budget';
            document.getElementById('budget-id').value = '';
            document.getElementById('budget-name').value = '';
            document.getElementById('budget-amount').value = '';
            document.getElementById('budget-period-select').value = 'month';

            document.querySelectorAll('#budget-color-options .color-dot').forEach((d, i) => d.classList.toggle('active', i === 0));
            document.querySelectorAll('#budget-icon-selector .icon-option').forEach((o, i) => o.classList.toggle('active', i === 0));

            await app.categories.renderSelector('budget-categories', 'expense', [], true);

            deleteBtn.classList.add('hidden');
        }

        app.openModal('modal-budget');
    }

    async save() {
        const name = document.getElementById('budget-name').value.trim();
        const amount = parseFloat(document.getElementById('budget-amount').value);

        if (!name) {
            app.showToast('Veuillez entrer un nom');
            return;
        }
        if (!amount || amount <= 0) {
            app.showToast('Veuillez entrer un montant');
            return;
        }

        const id = document.getElementById('budget-id').value || `budget_${Date.now()}`;
        const period = document.getElementById('budget-period-select').value;
        const color = document.querySelector('#budget-color-options .color-dot.active')?.dataset.color || '#2563eb';
        const icon = document.querySelector('#budget-icon-selector .icon-option.active')?.dataset.icon || 'account_balance_wallet';
        const categoryIds = app.categories.getSelectedFromSelector('budget-categories') || [];

        await app.db.put('budgets', { id, name, amount, period, color, icon, categoryIds });

        app.closeModal('modal-budget');
        this.loadAll();
        if (app.router.currentPage === 'home') app.loadHome();
        app.showToast('Budget enregistré');
    }
}
