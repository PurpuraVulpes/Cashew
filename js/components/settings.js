// ========================================
// SETTINGS COMPONENT
// ========================================

class SettingsManager {
    init() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('change', (e) => {
            this.setTheme(e.target.checked ? 'dark' : 'light');
        });

        // Color options
        document.querySelectorAll('#color-options .color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('#color-options .color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                this.setAccentColor(dot.dataset.color);
            });
        });

        // Currency
        document.getElementById('currency-select').addEventListener('change', (e) => {
            this.setCurrency(e.target.value);
        });

        // Import
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importFile(e.target.files[0]);
        });

        // Icon & color selectors in category modal
        document.querySelectorAll('#category-icon-selector .icon-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#category-icon-selector .icon-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
            });
        });

        document.querySelectorAll('#category-color-options .color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('#category-color-options .color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            });
        });
    }

    async loadSettings() {
        // Theme
        const theme = await app.db.getSetting('theme') || 'light';
        this.setTheme(theme, false);
        document.getElementById('theme-toggle').checked = theme === 'dark';

        // Accent color
        const color = await app.db.getSetting('accentColor');
        if (color) {
            this.setAccentColor(color, false);
            document.querySelectorAll('#color-options .color-dot').forEach(dot => {
                dot.classList.toggle('active', dot.dataset.color === color);
            });
        }

        // Currency
        const currency = await app.db.getSetting('currency') || 'EUR';
        CurrencyUtils.currentCurrency = currency;
        document.getElementById('currency-select').value = currency;
    }

    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) app.db.setSetting('theme', theme);

        // Update theme color meta
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#2563eb');
        }
    }

    setAccentColor(color, save = true) {
        document.documentElement.style.setProperty('--primary', color);
        // Generate lighter version
        document.documentElement.style.setProperty('--primary-dark', this.darken(color, 20));
        if (save) app.db.setSetting('accentColor', color);
    }

    async setCurrency(currency) {
        CurrencyUtils.currentCurrency = currency;
        await app.db.setSetting('currency', currency);
        app.showToast(`Devise: ${currency}`);
        // Refresh current page
        if (app.router.currentPage === 'home') app.loadHome();
    }

    darken(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100));
        const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * percent / 100));
        const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * percent / 100));
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    async importFile(file) {
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await app.db.importAll(data);
            app.showToast('Données importées avec succès');
            app.loadHome();
        } catch (e) {
            app.showToast('Erreur lors de l\'import');
            console.error(e);
        }
    }
}
