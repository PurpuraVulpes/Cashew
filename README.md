# 🥜 Cashew — Suivi de dépenses & budgets

Application web de finances personnelles inspirée de [Cashew — Expense Budget Tracker](https://apps.apple.com/fr/app/cashew-expense-budget-tracker/id6463662930).

100 % hors-ligne : toutes les données sont stockées localement dans le navigateur (localStorage). Aucun compte, aucun serveur.

## ✨ Fonctionnalités

- **🏠 Accueil** : solde total, revenus/dépenses du mois, taux d'épargne, flux sur 30 jours, budgets, paie estimée et opérations récentes
- **💸 Transactions** : dépenses, revenus et virements entre comptes — recherche, filtres (mois, compte, catégorie), regroupement par jour, export CSV
- **📊 Statistiques** : évolution sur 6 mois, répartition par catégorie, plus grosses dépenses, solde net, moyenne par jour
- **🎯 Budgets** : budget global + budgets par catégorie, alertes de dépassement, estimation du reste à dépenser par jour
- **💼 Travail** : saisie des horaires/vacations, taux horaire, majorations (heures sup, nuit, dimanche), pointeuse en temps réel, estimation du salaire versé le mois suivant
- **🏦 Comptes** : courant, épargne, espèces, carte, investissement — soldes calculés automatiquement, archivage
- **🐷 Objectifs** : projets d'épargne avec progression, échéances et alimentation en un clic
- **🔁 Abonnements** : suivi des prélèvements récurrents, coût mensuel estimé, enregistrement des échéances
- **🏷️ Catégories** : personnalisables (icônes + couleurs), dépenses et revenus
- **🎨 Thèmes** : 8 couleurs d'accent (Émeraude, Océan, Violet, Rose, Rouge, Orange, Lagoon, Minuit) + mode sombre
- **🔒 Sécurité** : verrouillage par code PIN (4 ou 6 chiffres), verrouillage auto après inactivité, protection anti-bruteforce
- **📲 PWA installable** : installez l'app sur téléphone/desktop, fonctionne hors-ligne via service worker
- **⚙️ Paramètres** : centre de contrôle complet — profil, apparence, devise, compte par défaut, premier jour de la semaine, widgets de l'accueil, config travail, gestion des comptes / catégories / budgets / objectifs / abonnements, export/import JSON

## 🚀 Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:5173

```bash
npm run build   # build de production
npm run preview # prévisualiser le build
```

## 🛠️ Stack

- React 18 + Vite 6
- Tailwind CSS 4
- Recharts (graphiques)
- Lucide (icônes)

## 📱 Design

- Mobile-first avec navigation basse + bouton d'action central (style Cashew)
- Sidebar complète sur desktop
- Mode sombre / clair + 8 couleurs de thème
