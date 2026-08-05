// ========================================
// DATABASE - IndexedDB Wrapper
// ========================================

class CashewDB {
    constructor() {
        this.dbName = 'cashew_db';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                if (!db.objectStoreNames.contains('transactions')) {
                    const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
                    txStore.createIndex('date', 'date', { unique: false });
                    txStore.createIndex('type', 'type', { unique: false });
                    txStore.createIndex('categoryId', 'categoryId', { unique: false });
                }

                if (!db.objectStoreNames.contains('budgets')) {
                    db.createObjectStore('budgets', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getSetting(key) {
        const result = await this.get('settings', key);
        return result ? result.value : null;
    }

    async setSetting(key, value) {
        return this.put('settings', { key, value });
    }

    async exportAll() {
        const transactions = await this.getAll('transactions');
        const budgets = await this.getAll('budgets');
        const categories = await this.getAll('categories');
        const settings = await this.getAll('settings');
        return { transactions, budgets, categories, settings, exportDate: new Date().toISOString() };
    }

    async importAll(data) {
        if (data.categories) {
            await this.clear('categories');
            for (const item of data.categories) await this.put('categories', item);
        }
        if (data.transactions) {
            await this.clear('transactions');
            for (const item of data.transactions) await this.put('transactions', item);
        }
        if (data.budgets) {
            await this.clear('budgets');
            for (const item of data.budgets) await this.put('budgets', item);
        }
        if (data.settings) {
            for (const item of data.settings) await this.put('settings', item);
        }
    }
}
