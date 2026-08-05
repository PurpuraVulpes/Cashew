// ========================================
// CATEGORIES COMPONENT
// ========================================

class CategoriesManager {
    constructor() {
        this.defaultCategories = [
            { id: 'cat_food', name: 'Alimentation', icon: 'restaurant', color: '#f97316', type: 'expense' },
            { id: 'cat_transport', name: 'Transport', icon: 'directions_car', color: '#2563eb', type: 'expense' },
            { id: 'cat_shopping', name: 'Shopping', icon: 'shopping_cart', color: '#ec4899', type: 'expense' },
            { id: 'cat_health', name: 'Santé', icon: 'local_hospital', color: '#dc2626', type: 'expense' },
            { id: 'cat_entertainment', name: 'Loisirs', icon: 'sports_esports', color: '#7c3aed', type: 'expense' },
            { id: 'cat_housing', name: 'Logement', icon: 'home', color: '#059669', type: 'expense' },
            { id: 'cat_education', name: 'Éducation', icon: 'school', color: '#06b6d4', type: 'expense' },
            { id: 'cat_travel', name: 'Voyage', icon: 'flight', color: '#d97706', type: 'expense' },
            { id: 'cat_bills', name: 'Factures', icon: 'receipt_long', color: '#64748b', type: 'expense' },
            { id: 'cat_clothing', name: 'Vêtements', icon: 'checkroom', color: '#f43f5e', type: 'expense' },
            { id: 'cat_coffee', name: 'Café & Snacks', icon: 'local_cafe', color: '#92400e', type: 'expense' },
            { id: 'cat_gifts', name: 'Cadeaux', icon: 'redeem', color: '#e11d48', type: 'expense' },
            { id: 'cat_pets', name: 'Animaux', icon: 'pets', color: '#84cc16', type: 'expense' },
            { id: 'cat_other', name: 'Autre', icon: 'more_horiz', color: '#94a3b8', type: 'both' },
            { id: 'cat_salary', name: 'Salaire', icon: 'work', color: '#059669', type: 'income' },
            { id: 'cat_freelance', name: 'Freelance', icon: 'laptop', color: '#2563eb', type: 'income' },
            { id: 'cat_investment', name: 'Investissement', icon: 'trending_up', color: '#7c3aed', type: 'income' },
            { id: 'cat_savings_in', name: 'Épargne', icon: 'savings', color: '#d97706', type: 'income' },
        ];
    }

    async init() {
        const existing = await app.db.getAll('categories');
        if (existing.length === 0) {
            for (const cat of this.defaultCategories) {
                await app.db.put('categories', cat);
            }
        }
    }

    async getAll() {
        return app.db.getAll('categories');
    }

    async getById(id) {
        return app.db.get('categories', id);
    }

    async getByType(type) {
        const all = await this.getAll();
        return all.filter(c => c.type === type || c.type === 'both');
    }

    async renderSelector(containerId, type = 'expense', selectedId = null, multi = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categories = await this.getByType(type);
        container.innerHTML = categories.map(cat => `
            <div class="category-chip ${selectedId === cat.id || (Array.isArray(selectedId) && selectedId.includes(cat.id)) ? 'active' : ''}" 
                 data-id="${cat.id}" data-multi="${multi}">
                <span class="material-icons-round" style="color:${cat.color}">${cat.icon}</span>
                ${cat.name}
            </div>
        `).join('');

        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (multi) {
                    chip.classList.toggle('active');
                } else {
                    container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                }
            });
        });
    }

    getSelectedFromSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const multi = container.classList.contains('multi');
        const active = container.querySelectorAll('.category-chip.active');

        if (multi) {
            return Array.from(active).map(el => el.dataset.id);
        }
        return active.length > 0 ? active[0].dataset.id : null;
    }

    async showManager() {
        const categories = await this.getAll();
        const list = document.getElementById('categories-manager-list');

        list.innerHTML = categories.map(cat => `
            <div class="category-manager-item" data-id="${cat.id}">
                <div class="category-manager-icon" style="background:${cat.color}">
                    <span class="material-icons-round">${cat.icon}</span>
                </div>
                <span class="category-manager-name">${cat.name}</span>
                <span class="category-manager-type">${cat.type === 'both' ? 'Tous' : cat.type === 'income' ? 'Revenu' : 'Dépense'}</span>
                <span class="material-icons-round" style="color:var(--text-tertiary)">chevron_right</span>
            </div>
        `).join('');

        list.querySelectorAll('.category-manager-item').forEach(item => {
            item.addEventListener('click', () => this.editCategory(item.dataset.id));
        });

        document.getElementById('btn-add-category').onclick = () => this.editCategory(null);

        app.openModal('modal-categories');
    }

    async editCategory(id) {
        const modal = document.getElementById('modal-category-edit');
        const title = document.getElementById('modal-category-title');
        const deleteBtn = document.getElementById('btn-delete-category');

        if (id) {
            const cat = await this.getById(id);
            if (!cat) return;

            title.textContent = 'Modifier la catégorie';
            document.getElementById('category-id').value = cat.id;
            document.getElementById('category-name').value = cat.name;
            document.getElementById('category-type').value = cat.type;

            // Set icon
            document.querySelectorAll('#category-icon-selector .icon-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.icon === cat.icon);
            });

            // Set color
            document.querySelectorAll('#category-color-options .color-dot').forEach(dot => {
                dot.classList.toggle('active', dot.dataset.color === cat.color);
            });

            deleteBtn.classList.remove('hidden');
            deleteBtn.onclick = async () => {
                if (confirm('Supprimer cette catégorie ?')) {
                    await app.db.delete('categories', id);
                    app.closeModal('modal-category-edit');
                    this.showManager();
                    app.showToast('Catégorie supprimée');
                }
            };
        } else {
            title.textContent = 'Nouvelle catégorie';
            document.getElementById('category-id').value = '';
            document.getElementById('category-name').value = '';
            document.getElementById('category-type').value = 'expense';
            document.querySelectorAll('#category-icon-selector .icon-option').forEach((opt, i) => {
                opt.classList.toggle('active', i === 0);
            });
            document.querySelectorAll('#category-color-options .color-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === 0);
            });
            deleteBtn.classList.add('hidden');
        }

        document.getElementById('btn-save-category').onclick = async () => {
            await this.saveCategory();
        };

        app.openModal('modal-category-edit');
    }

    async saveCategory() {
        const id = document.getElementById('category-id').value || `cat_${Date.now()}`;
        const name = document.getElementById('category-name').value.trim();
        if (!name) {
            app.showToast('Veuillez entrer un nom');
            return;
        }

        const icon = document.querySelector('#category-icon-selector .icon-option.active')?.dataset.icon || 'more_horiz';
        const color = document.querySelector('#category-color-options .color-dot.active')?.dataset.color || '#94a3b8';
        const type = document.getElementById('category-type').value;

        await app.db.put('categories', { id, name, icon, color, type });

        app.closeModal('modal-category-edit');
        this.showManager();
        app.showToast('Catégorie enregistrée');
    }
}
