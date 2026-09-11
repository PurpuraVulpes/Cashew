import { uid, todayISO, toISODate } from '../utils/helpers.js'

// ---- Catalogue d'icônes (clés mappées vers lucide dans IconBadge) ----
export const CATEGORY_ICONS = [
  'cart', 'food', 'coffee', 'car', 'home', 'bolt', 'health', 'fun', 'plane',
  'shop', 'gift', 'book', 'sport', 'pet', 'phone', 'bus', 'baby', 'shirt',
  'beauty', 'bank', 'salary', 'chart', 'dots',
]

export const PALETTE = [
  '#0d9d6c', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899',
  '#14b8a6', '#f97316', '#84cc16', '#6366f1', '#a855f7', '#64748b',
]

export const ACCOUNT_TYPES = [
  { id: 'courant', label: 'Compte courant', icon: 'bank' },
  { id: 'epargne', label: 'Épargne', icon: 'piggy' },
  { id: 'especes', label: 'Espèces', icon: 'cash' },
  { id: 'carte', label: 'Carte / Crédit', icon: 'card' },
  { id: 'invest', label: 'Investissement', icon: 'chart' },
]

// Configuration par défaut du module Travail
export const DEFAULT_WORK = {
  hourlyRate: 15.5, // taux horaire net
  payDay: 5, // salaire versé vers le 5 du mois suivant
  weeklyTarget: 35, // objectif d'heures hebdo
  defaultStart: '09:00',
  defaultEnd: '18:00',
  defaultBreak: 60, // pause en minutes
  rates: { normal: 1, overtime25: 1.25, overtime50: 1.5, night: 1.15, sunday: 2 },
}

const EXPENSE_CATS = [
  ['Alimentation', 'cart', '#22c55e'],
  ['Restaurants', 'food', '#f97316'],
  ['Cafés & bars', 'coffee', '#a855f7'],
  ['Transport', 'bus', '#0ea5e9'],
  ['Voiture', 'car', '#6366f1'],
  ['Logement', 'home', '#ef4444'],
  ['Factures', 'bolt', '#f59e0b'],
  ['Santé', 'health', '#ec4899'],
  ['Loisirs', 'fun', '#8b5cf6'],
  ['Voyages', 'plane', '#14b8a6'],
  ['Shopping', 'shop', '#eab308'],
  ['Cadeaux', 'gift', '#f43f5e'],
  ['Sport', 'sport', '#84cc16'],
  ['Abonnements', 'phone', '#64748b'],
]

const INCOME_CATS = [
  ['Salaire', 'salary', '#0d9d6c'],
  ['Freelance', 'bolt', '#0ea5e9'],
  ['Investissements', 'chart', '#8b5cf6'],
  ['Autres revenus', 'dots', '#64748b'],
]

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function buildSeed() {
  const categories = [
    ...EXPENSE_CATS.map(([name, icon, color]) => ({ id: uid(), name, icon, color, type: 'expense' })),
    ...INCOME_CATS.map(([name, icon, color]) => ({ id: uid(), name, icon, color, type: 'income' })),
  ]
  const catByName = (n) => categories.find((c) => c.name === n).id

  const accounts = [
    { id: uid(), name: 'Compte courant', type: 'courant', icon: 'bank', color: '#0d9d6c', initialBalance: 2350, archived: false },
    { id: uid(), name: 'Livret A', type: 'epargne', icon: 'piggy', color: '#0ea5e9', initialBalance: 8200, archived: false },
    { id: uid(), name: 'Espèces', type: 'especes', icon: 'cash', color: '#f59e0b', initialBalance: 180, archived: false },
  ]
  const [checking, livret, cash] = accounts

  const transactions = []
  const push = (tx) => transactions.push({ id: uid(), ...tx })

  const now = new Date()
  const day = 86400000

  // Revenus récurrents (3 derniers mois)
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    push({ type: 'income', amount: 2850, accountId: checking.id, categoryId: catByName('Salaire'), date: toISODate(d), note: 'Salaire mensuel' })
    if (m < 2) {
      push({ type: 'income', amount: 320 + m * 80, accountId: checking.id, categoryId: catByName('Freelance'), date: toISODate(new Date(now.getFullYear(), now.getMonth() - m, 14)), note: 'Mission freelance' })
    }
  }

  // Dépenses fixes mensuelles
  const fixed = [
    ['Logement', 890, 3, 'Loyer appartement'],
    ['Factures', 67, 6, 'Électricité'],
    ['Factures', 34, 8, 'Internet fibre'],
    ['Abonnements', 13, 11, 'Netflix'],
    ['Abonnements', 11, 15, 'Spotify'],
    ['Transport', 75, 2, 'Pass Navigo'],
    ['Sport', 30, 5, 'Salle de sport'],
  ]
  for (let m = 0; m < 3; m++) {
    for (const [cat, amt, dayOf, note] of fixed) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, Math.min(dayOf, 28))
      if (d > now) continue
      push({ type: 'expense', amount: amt, accountId: checking.id, categoryId: catByName(cat), date: toISODate(d), note })
    }
  }

  // Dépenses variables réalistes sur 90 jours
  const variable = [
    ['Alimentation', 18, 85, ['Carrefour', 'Lidl', 'Monoprix', 'Marché Bastille', 'Biocoop']],
    ['Restaurants', 14, 60, ['Sushi Yoko', 'Bistrot Léon', 'Pizza Roma', 'Burger House', 'Crêperie']],
    ['Cafés & bars', 3, 18, ['Café de Flore', 'Starbucks', 'Bar du coin']],
    ['Transport', 2, 25, ['Uber', 'Taxi', 'SNCF']],
    ['Santé', 12, 55, ['Pharmacie', 'Médecin', 'Parapharmacie']],
    ['Loisirs', 9, 45, ['Cinéma Pathé', 'Escape game', 'Concert', 'Musée']],
    ['Shopping', 15, 120, ['Zara', 'H&M', 'Amazon', 'Fnac', 'Decathlon']],
    ['Voiture', 30, 80, ['Essence Total', 'Parking', 'Péage']],
  ]
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now.getTime() - i * day)
    const n = Math.random() < 0.55 ? 1 : Math.random() < 0.2 ? 2 : 0
    for (let k = 0; k < n; k++) {
      const [cat, min, max, places] = randomOf(variable)
      const amount = Math.round((min + Math.random() * (max - min)) * 100) / 100
      const useCash = Math.random() < 0.18
      push({
        type: 'expense',
        amount,
        accountId: useCash ? cash.id : checking.id,
        categoryId: catByName(cat),
        date: toISODate(date),
        note: randomOf(places),
      })
    }
  }

  // Quelques virements vers épargne
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 5)
    if (d > now) continue
    push({ type: 'transfer', amount: 300, accountId: checking.id, toAccountId: livret.id, categoryId: null, date: toISODate(d), note: 'Épargne mensuelle' })
  }

  // Quelques extras ce mois-ci
  push({ type: 'expense', amount: 24.5, accountId: checking.id, categoryId: catByName('Restaurants'), date: todayISO(), note: 'Déjeuner Le Petit Zinc' })
  push({ type: 'expense', amount: 42.9, accountId: checking.id, categoryId: catByName('Alimentation'), date: todayISO(), note: 'Carrefour City' })

  transactions.sort((a, b) => (a.date < b.date ? 1 : -1))

  const budgets = [
    { id: uid(), categoryId: 'all', amount: 1800, period: 'monthly' },
    { id: uid(), categoryId: catByName('Alimentation'), amount: 400, period: 'monthly' },
    { id: uid(), categoryId: catByName('Restaurants'), amount: 180, period: 'monthly' },
    { id: uid(), categoryId: catByName('Shopping'), amount: 200, period: 'monthly' },
    { id: uid(), categoryId: catByName('Loisirs'), amount: 120, period: 'monthly' },
    { id: uid(), categoryId: catByName('Transport'), amount: 110, period: 'monthly' },
  ]

  const goals = [
    { id: uid(), name: 'Vacances au Japon', target: 3500, saved: 1950, deadline: `${now.getFullYear() + 1}-07-01`, color: '#ec4899', icon: 'plane' },
    { id: uid(), name: "Fond d'urgence", target: 6000, saved: 4200, deadline: `${now.getFullYear() + 1}-01-01`, color: '#0d9d6c', icon: 'piggy' },
    { id: uid(), name: 'Nouveau MacBook', target: 1600, saved: 640, deadline: `${now.getFullYear()}-12-01`, color: '#0ea5e9', icon: 'phone' },
  ]

  const nextMonth = (dayOf) => {
    const d = new Date(now.getFullYear(), now.getMonth(), dayOf)
    if (d <= now) d.setMonth(d.getMonth() + 1)
    return toISODate(d)
  }
  const recurring = [
    { id: uid(), name: 'Netflix', type: 'expense', amount: 13.49, categoryId: catByName('Abonnements'), accountId: checking.id, frequency: 'monthly', nextDate: nextMonth(11), active: true },
    { id: uid(), name: 'Spotify', type: 'expense', amount: 10.99, categoryId: catByName('Abonnements'), accountId: checking.id, frequency: 'monthly', nextDate: nextMonth(15), active: true },
    { id: uid(), name: 'Salle de sport', type: 'expense', amount: 29.99, categoryId: catByName('Sport'), accountId: checking.id, frequency: 'monthly', nextDate: nextMonth(5), active: true },
    { id: uid(), name: 'Loyer', type: 'expense', amount: 890, categoryId: catByName('Logement'), accountId: checking.id, frequency: 'monthly', nextDate: nextMonth(3), active: true },
    { id: uid(), name: 'Salaire', type: 'income', amount: 2850, categoryId: catByName('Salaire'), accountId: checking.id, frequency: 'monthly', nextDate: nextMonth(1), active: true },
  ]

  // ---- Vacations de travail (démo) : lun–ven 9h–18h, mois précédent + mois en cours ----
  const shifts = []
  const seedMonthShifts = (year, month, upToDay) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= Math.min(upToDay, daysInMonth); d++) {
      const dt = new Date(year, month, d)
      const dow = dt.getDay()
      if (dow === 0 || dow === 6) continue
      shifts.push({ id: uid(), date: toISODate(dt), start: '09:00', end: '18:00', breakMinutes: 60, type: 'normal', note: '' })
    }
  }
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  seedMonthShifts(prev.getFullYear(), prev.getMonth(), 31)
  seedMonthShifts(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  // Un samedi en heures sup + un dimanche majoré le mois précédent (démo)
  const daysPrev = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate()
  for (let d = 1; d <= daysPrev; d++) {
    const dt = new Date(prev.getFullYear(), prev.getMonth(), d)
    if (dt.getDay() === 6 && !shifts.some((s) => s.date === toISODate(dt))) {
      shifts.push({ id: uid(), date: toISODate(dt), start: '09:00', end: '13:00', breakMinutes: 0, type: 'overtime25', note: 'Inventaire' })
      break
    }
  }
  for (let d = 1; d <= daysPrev; d++) {
    const dt = new Date(prev.getFullYear(), prev.getMonth(), d)
    if (dt.getDay() === 0) {
      shifts.push({ id: uid(), date: toISODate(dt), start: '10:00', end: '16:00', breakMinutes: 30, type: 'sunday', note: 'Permanence' })
      break
    }
  }
  shifts.sort((a, b) => (a.date < b.date ? 1 : -1))

  return {
    accounts,
    categories,
    transactions,
    budgets,
    goals,
    recurring,
    shifts,
    work: { ...DEFAULT_WORK },
    workTimer: null,
    settings: { name: 'Alex', currency: 'EUR', theme: 'light', themeColor: 'emerald', hideBalances: false, defaultAccountId: '', weekStart: 'monday', widgets: { flow: true, mix: true, work: true, recent: true } },
  }
}
