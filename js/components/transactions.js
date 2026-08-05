// ========================================
// TRANSACTIONS COMPONENT
// ========================================

class TransactionsManager {
    constructor() {
        this.currentPeriod = 'month';
        this.amountString = '0';
        this.currentType = 'expense';
    }

    init() {
        // Period buttons
        document.querySelectorAll('#transaction-period .period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#transaction-period .period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.loadAll();
            });
        });

        // Type toggle
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentType = btn.dataset.type;
                app.categories.renderSelector('category-selector', this.currentType);
            });
        });

        // Numpad
        document.querySelectorAll('.numpad-key').forEach(key => {
            key.addEventListener('click', () => this.handleNumpad(key.dataset.key));
        });

        // Save transaction
        document.getElementById('btn-save-transaction').addEventListener('click', () => this.save());

        // Add button
        document.getElementById('btn-add-transaction').addEventListener('click', () => this.openAddModal());

        // Search
        document.getElementById('btn-search').addEventListener('click', () => {
            app.openModal('modal-search');
            setTimeout(() => document.getElementById('search-input').focus(), 300);
        });

        document.getElementById('search-input').addEventListener('input', (e) => this.search(e.target.value));
    }

    handleNumpad(key) {
        if (key === 'backspace') {
            this.amountString = this.amountString.slice(0, -1) || '0';
        } else if (key === '.') {
            if (!this.amountString.includes('.')) {
                this.amountString += '.';
            }
        } else {
            if (this.amountString === '0') {
                this.amountString = key;
            } else {
                // Limit decimals to 2
                const parts = this.amountString.split('.');
                if (parts[1] && parts[1].length >= 2) return;
                this.amountString += key;
            }
        }

        document.getElementById('amount-value').textContent = this.amountString;
    }

    async openAddModal(editId = null) {
        this.amountString = '0';
        this.currentType = 'expense';

        const title = document.getElementById('modal-transaction-title');
        document.getElementById('transaction-id').value = '';

        // Set defaults
        const now = new Date();
        document.getElementById('transaction-date').value = now.toISOString().split('T')[0];
        document.getElementById('transaction-time').value = now.toTimeString().slice(0, 5);
        document.getElementById('transaction-title').value = '';
        document.getElementById('transaction-notes').value = '';
        document.getElementById('transaction-tags').value = '';

        // Reset type
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.type-btn[data-type="expense"]').classList.add('active');

        document.getElementById('input-currency').textContent = CurrencyUtils.getSymbol();

        if (editId) {
            const tx = await app.db.get('transactions', editId);
            if (!tx) return;

            title.textContent = 'Modifier la transaction';
            document.getElementById('transaction-id').value = tx.id;
            this.amountString = tx.amount.toString();
            this.currentType = tx.type;
            document.getElementById('transaction-title').value = tx.title || '';
            document.getElementById('transaction-date').value = tx.date;
            document.getElementById('transaction-time').value = tx.time || '12:00';
            document.getElementById('transaction-notes').value = tx.notes || '';
            document.getElementById('transaction-tags').value = (tx.tags || []).join(', ');

            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.type-btn[data-type="${tx.type}"]`).classList.add('active');

            await app.categories.renderSelector('category-selector', this.currentType, tx.categoryId);
        } else {
            title.textContent = 'Nouvelle transaction';
            await app.categories.renderSelector('category-selector', 'expense');
        }

        document.getElementById('amount-value').textContent = this.amountString;
        app.openModal('modal-transaction');
    }

    async save() {
        const amount = parseFloat(this.amountString);
        if (!amount || amount <= 0) {
            app.showToast('Veuillez entrer un montant');
            return;
        }

        const categoryId = app.categories.getSelectedFromSelector('category-selector');
        if (!categoryId) {
            app.showToast('Veuillez choisir une catégorie');
            return;
        }

        const id = document.getElementById('transaction-id').value || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const title = document.getElementById('transaction-title').value.trim();
        const date = document.getElementById('transaction-date').value;
        const time = document.getElementById('transaction-time').value;
        const notes = document.getElementById('transaction-notes').value.trim();
        const tagsStr = document.getElementById('transaction-tags').value.trim();
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

        const type = document.querySelector('.type-btn.active').dataset.type;

        const category = await app.categories.getById(categoryId);

        const transaction = {
            id,
            amount,
            type,
            categoryId,
            categoryName: category?.name || '',
            categoryIcon: category?.icon || 'more_horiz',
            categoryColor: category?.color || '#94a3b8',
            title: title || category?.name || 'Transaction',
            date,
            time,
            notes,
            tags,
            createdAt: new Date().toISOString()
        };

        await app.db.put('transactions', transaction);
        app.closeModal('modal-transaction');
        app.showToast(document.getElementById('transaction-id').value ? 'Transaction modifiée' : 'Transaction ajoutée');

        // Refresh current page
        if (app.router.currentPage === 'home') app.loadHome();
        else if (app.router.currentPage === 'transactions') this.loadAll();
        else if (app.router.currentPage === 'stats') app.stats.load();
    }

    async loadAll() {
        const transactions = await app.db.getAll('transactions');
        const filtered = this.filterByPeriod(transactions, this.currentPeriod);

        // Sort by date desc, then time desc
        filtered.sort((a, b) => {
            const dateComp = b.date.localeCompare(a.date);
            if (dateComp !== 0) return dateComp;
            return (b.time || '').localeCompare(a.time || '');
        });

        // Summary
        const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        document.getElementById('period-income').textContent = CurrencyUtils.format(income);
        document.getElementById('period-expenses').textContent = CurrencyUtils.format(expenses);

        // Group by date
        const grouped = {};
        filtered.forEach(tx => {
            if (!grouped[tx.date]) grouped[tx.date] = [];
            grouped[tx.date].push(tx);
        });

        const container = document.getElementById('all-transactions');
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">receipt_long</span>
                    <p>Aucune transaction</p>
                    <p style="font-size:12px;margin-top:4px">Appuyez sur + pour en ajouter une</p>
                </div>`;
            return;
        }

        container.innerHTML = Object.entries(grouped).map(([date, txs]) => {
            const dayTotal = txs.reduce((s, t) => s + (t.type === 'expense' ? -t.amount : t.amount), 0);
            return `
                <div class="transaction-date-group">
                    <div class="transaction-date-header">
                        <span>${this.formatDateHeader(date)}</span>
                        <span style="font-weight:700;color:${dayTotal >= 0 ? 'var(--success)' : 'var(--danger)'}">
                            ${dayTotal >= 0 ? '+' : ''}${CurrencyUtils.format(dayTotal)}
                        </span>
                    </div>
                    ${txs.map(tx => this.renderTransaction(tx)).join('')}
                </div>
            `;
        }).join('');

        this.attachTransactionListeners(container);
    }

    async loadRecent(limit = 5) {
        const transactions = await app.db.getAll('transactions');
        transactions.sort((a, b) => {
            const dateComp = b.date.localeCompare(a.date);
            if (dateComp !== 0) return dateComp;
            return (b.time || '').localeCompare(a.time || '');
        });

        const recent = transactions.slice(0, limit);
        const container = document.getElementById('recent-transactions');

        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <span class="material-icons-round">receipt_long</span>
                    <p>Pas encore de transactions</p>
                </div>`;
            return;
        }

        container.innerHTML = recent.map(tx => this.renderTransaction(tx)).join('');
        this.attachTransactionListeners(container);
    }

    renderTransaction(tx) {
        const amountClass = tx.type === 'income' ? 'income' : 'expense';
        const prefix = tx.type === 'income' ? '+' : '-';

        return `
            <div class="transaction-item" data-id="${tx.id}">
                <div class="transaction-icon" style="background:${tx.categoryColor || '#94a3b8'}">
                    <span class="material-icons-round">${tx.categoryIcon || 'more_horiz'}</span>
                </div>
                <div class="transaction-info">
                    <div class="transaction-title">${tx.title || 'Transaction'}</div>
                    <div class="transaction-category">${tx.categoryName || ''}</div>
                </div>
                <div>
                    <div class="transaction-amount ${amountClass}">${prefix}${CurrencyUtils.format(tx.amount)}</div>
                    <div class="transaction-time">${tx.time || ''}</div>
                </div>
            </div>
        `;
    }

    attachTransactionListeners(container) {
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('click', () => this.showDetail(item.dataset.id));
        });
    }

    async showDetail(id) {
        const tx = await app.db.get('transactions', id);
        if (!tx) return;

        const body = document.getElementById('transaction-detail-body');
        const amountClass = tx.type === 'income' ? 'income' : 'expense';
        const prefix = tx.type === 'income' ? '+' : '-';

        body.innerHTML = `
            <div class="detail-amount ${amountClass}">${prefix}${CurrencyUtils.format(tx.amount)}</div>
            <div class="detail-row">
                <span class="detail-label">Titre</span>
                <span class="detail-value">${tx.title || 'Transaction'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Catégorie</span>
                <span class="detail-value">
                    <span class="material-icons-round" style="font-size:16px;color:${tx.categoryColor}">${tx.categoryIcon}</span>
                    ${tx.categoryName}
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value">${tx.type === 'income' ? 'Revenu' : tx.type === 'expense' ? 'Dépense' : 'Transfert'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${this.formatDateHeader(tx.date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Heure</span>
                <span class="detail-value">${tx.time || '-'}</span>
            </div>
            ${tx.notes ? `
            <div class="detail-row">
                <span class="detail-label">Notes</span>
                <span class="detail-value">${tx.notes}</span>
            </div>` : ''}
            ${tx.tags && tx.tags.length > 0 ? `
            <div class="detail-row">
                <span class="detail-label">Tags</span>
                <div class="detail-tags">
                    ${tx.tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}
                </div>
            </div>` : ''}
        `;

        document.getElementById('btn-edit-transaction').onclick = () => {
            app.closeModal('modal-transaction-detail');
            setTimeout(() => this.openAddModal(id), 300);
        };

        document.getElementById('btn-delete-transaction').onclick = async () => {
            if (confirm('Supprimer cette transaction ?')) {
                await app.db.delete('transactions', id);
                app.closeModal('modal-transaction-detail');
                app.showToast('Transaction supprimée');
                if (app.router.currentPage === 'home') app.loadHome();
                else this.loadAll();
            }
        };

        app.openModal('modal-transaction-detail');
    }

    async search(query) {
        const container = document.getElementById('search-results');
        if (!query.trim()) {
            container.innerHTML = `
                <div class="empty-state small">
                    <span class="material-icons-round">search</span>
                    <p>Tapez pour rechercher</p>
                </div>`;
            return;
        }

        const transactions = await app.db.getAll('transactions');
        const q = query.toLowerCase();
        const results = transactions.filter(tx =>
            (tx.title || '').toLowerCase().includes(q) ||
            (tx.categoryName || '').toLowerCase().includes(q) ||
            (tx.notes || '').toLowerCase().includes(q) ||
            (tx.tags || []).some(t => t.toLowerCase().includes(q))
        );

        results.sort((a, b) => b.date.localeCompare(a.date));

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <span class="material-icons-round">search_off</span>
                    <p>Aucun résultat</p>
                </div>`;
            return;
        }

        container.innerHTML = results.map(tx => this.renderTransaction(tx)).join('');
        this.attachTransactionListeners(container);
    }

    filterByPeriod(transactions, period) {
        const now = new Date();
        let startDate;

        switch (period) {
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
            case 'all':
                return transactions;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const startStr = startDate.toISOString().split('T')[0];
        return transactions.filter(tx => tx.date >= startStr);
    }

    formatDateHeader(dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) return "Aujourd'hui";
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'Hier';

        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }
}
