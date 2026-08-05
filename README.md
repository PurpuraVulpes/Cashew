# Cashew
# 🥜 Cashew - Budget & Expense Tracker

A beautiful, fully offline Progressive Web App (PWA) for tracking expenses and managing budgets. Inspired by [Cashew](https://apps.apple.com/fr/app/cashew-expense-budget-tracker/id6463662930).

![Cashew Screenshot](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)

## ✨ Features

- 💰 **Track transactions** - Add income, expenses, and transfers
- 📊 **Budget management** - Create budgets with progress tracking
- 📈 **Statistics** - Beautiful charts (line, bar, donut) with insights
- 🏷️ **Categories** - Customizable categories with icons and colors
- 🔍 **Search** - Find any transaction quickly
- 🌙 **Dark mode** - Beautiful light and dark themes
- 🎨 **Accent colors** - Choose your favorite color
- 💱 **Multi-currency** - EUR, USD, GBP, CHF, CAD, JPY
- 📱 **PWA** - Install on any device, works 100% offline
- 💾 **Export/Import** - Backup and restore your data (JSON)
- 🔒 **Privacy first** - All data stored locally (IndexedDB)

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)

1. **Fork** this repository
2. Go to **Settings** → **Pages**
3. Set source to **main** branch, root folder
4. Visit `https://yourusername.github.io/cashew-budget-tracker`

### Option 2: Local Development

```bash
git clone https://github.com/yourusername/cashew-budget-tracker.git
cd cashew-budget-tracker

# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
Then open http://localhost:8000

Option 3: Deploy Anywhere
This is a static site - no build step required! Deploy to:

Netlify: Drag & drop the folder
Vercel: Connect your repo
Cloudflare Pages: Connect your repo
Any web server: Just upload the files
📱 Install as App
Open the app in Chrome/Safari
Click "Install" or "Add to Home Screen"
Enjoy the native app experience!
🏗️ Tech Stack
Pure HTML/CSS/JS - No frameworks, no build tools
IndexedDB - Client-side database
Canvas API - Custom charts (no chart library)
Service Worker - Offline support & caching
Web App Manifest - PWA installability
📁 Project Structure
text

├── index.html          # Main HTML
├── css/
│   └── style.css       # All styles (~900 lines)
├── js/
│   ├── app.js          # Main app controller
│   ├── db.js           # IndexedDB wrapper
│   ├── router.js       # SPA router
│   ├── components/
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── categories.js
│   │   ├── stats.js
│   │   └── settings.js
│   └── utils/
│       ├── currency.js  # Currency formatting
│       └── charts.js    # Canvas chart library
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
└── README.md
🎨 Screenshots
Home	Transactions	Budgets	Stats
Balance overview, budgets, recent transactions, category chart	Grouped by date, period filter	Progress bars, spending vs limit	Line chart, bar chart, top categories
📝 License
MIT License - feel free to use, modify, and distribute.

🤝 Contributing
Fork the repo
Create a feature branch (git checkout -b feature/amazing)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing)
Open a Pull Request
Made with ❤️ and 🥜

text


---

## Déploiement sur GitHub Pages

1. **Créez un nouveau repository** sur GitHub (ex: `cashew-budget-tracker`)

2. **Initialisez et poussez** :
```bash
git init
git add .
git commit -m "Initial commit - Cashew Budget Tracker"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/cashew-budget-tracker.git
git push -u origin main
