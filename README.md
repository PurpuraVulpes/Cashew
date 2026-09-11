# 🥜 Cashew — Budget & Dépenses

Application budgétaire **100 % locale et hors-ligne**, inspirée de
[Cashew — Expense Budget Tracker](https://apps.apple.com/fr/app/cashew-expense-budget-tracker/id6463662930).
Suivez vos comptes, vos dépenses et vos budgets avec une interface soignée,
des graphiques clairs, un mode sombre et des couleurs d'accent personnalisables.

Il s'agit d'une application web (React + Vite), pensée mobile-first, qui se
comporte comme une application native : feuilles inférieures, pavé numérique,
navigation basse, animations, et installation possible en PWA.

## ✨ Fonctionnalités

- **Accueil** : cartes de comptes en carrousel, bannières de budgets avec
  progression, jauge « Aujourd'hui » et suggestion de budget quotidien,
  graphique d'évolution du solde sur 7 / 30 / 90 jours.
- **Transactions** : recherche, filtres par compte, par type (revenu / dépense)
  et par abonnements récurrents, regroupement par jour et totaux du mois.
- **Budgets** : budgets mensuels, hebdomadaires ou uniques, associés à une ou
  plusieurs catégories ; graphique en anneau (donut) des dépenses par catégorie
  avec navigation par mois.
- **Ajout rapide** : feuille « Ajouter une transaction » avec pavé numérique,
  sélecteur de catégorie illustrée, compte, date et récurrence
  (hebdomadaire / mensuelle / annuelle, matérialisée automatiquement).
- **Comptes** : création et personnalisation (icône, couleur, solde initial,
  inclusion dans le total).
- **Personnalisation poussée** : thème clair / sombre / automatique,
  **12 couleurs d'accent** ou **n'importe quelle couleur personnalisée**
  (sélecteur de couleur), et **5 teintes de fond** (Vert, Bleu nuit, Gris,
  Cacao, Noir pur AMOLED) — chacune déclinée en clair et en sombre.
- Devise au choix (€, $, £, CHF, CAD, ¥).
- **Vos données restent chez vous** : tout est stocké dans `localStorage`.
  Export CSV (Excel), sauvegarde et restauration JSON, réinitialisation.
- **Français d'abord**, formatage des montants et dates selon `fr-FR`.

## 🛠️ Stack technique

- [React 18](https://react.dev) avec hooks et contexte
- [Vite 5](https://vitejs.dev)
- [lucide-react](https://lucide.dev) pour les icônes
- Graphiques en **SVG natif** (courbe lissée avec dégradé, anneau segmenté),
  aucune bibliothèque de graphes
- Aucun serveur, aucune télémétrie, aucun compte

## 🚀 Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
```

Build de production :

```bash
npm run build
npm run preview
```

Test de fumée (rendu des 4 pages + contrôles sur les données) :

```bash
npm test
```

## 🗂️ Structure du projet

```
src/
├── App.jsx               # Coquille de l'app, navigation, thème
├── main.jsx
├── index.css             # Design system (variables clair/sombre, composants)
├── store.jsx             # État global + persistance + récurrences
├── ui.jsx                # Piles de feuilles (bottom sheets)
├── data.js               # Catégories, accents, devises
├── seed.js               # Données de démonstration (dates dynamiques)
├── utils.js              # Dates, montants, calculs budgétaires
├── components/           # Sheets, navigation, graphiques SVG, lignes…
├── sheets/               # Transaction, Compte, Budget
└── pages/                # Accueil, Transactions, Budgets, Réglages
```

## 🔒 Modèle de données

```ts
Transaction {
  id, type: 'income' | 'expense', amount, name,
  categoryId, accountId, date: 'YYYY-MM-DD',
  recurring: { frequency: 'weekly'|'monthly'|'yearly', every } | null,
  parentId // pour les occurrences générées d'une récurrence
}
Account  { id, name, emoji, color, initialBalance, includeInTotal }
Budget   { id, name, amount, period: 'monthly'|'weekly'|'oneoff',
           startDate, endDate?, categoryIds[] }
```

## 📄 Licence

MIT — fait avec plaisir, en s'inspirant de l'excellente application Cashew.
