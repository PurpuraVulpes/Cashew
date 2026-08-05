// ========================================
// ROUTER
// ========================================

class Router {
    constructor() {
        this.currentPage = 'home';
        this.pageTitles = {
            home: 'Accueil',
            transactions: 'Transactions',
            budgets: 'Budgets',
            stats: 'Statistiques',
            settings: 'Réglages'
        };
    }

    init() {
        // Nav buttons
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigate(page);
            });
        });
    }

    navigate(page) {
        if (!document.getElementById(`page-${page}`)) return;

        this.currentPage = page;

        // Update pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');

        // Update nav
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Update header
        document.querySelector('.header-title').textContent = this.pageTitles[page] || page;

        // Trigger page load
        if (typeof app !== 'undefined') {
            switch (page) {
                case 'home': app.loadHome(); break;
                case 'transactions': app.transactions.loadAll(); break;
                case 'budgets': app.budgets.loadAll(); break;
                case 'stats': app.stats.load(); break;
            }
        }

        // Scroll to top
        document.querySelector('.pages-container').scrollTop = 0;
        window.scrollTo(0, 0);
    }
}
