import { uid, toISODate, addDays, startOfMonth } from './utils.js'

// Génère un jeu de démonstration réaliste, dates relatives à aujourd'hui.
export function buildSeedState() {
  const accounts = [
    { id: 'a_bank', name: 'Banque', emoji: '🏦', color: '#4a90e2', initialBalance: 0, includeInTotal: true },
    { id: 'a_cash', name: 'Espèces', emoji: '💵', color: '#52b788', initialBalance: 40, includeInTotal: true },
  ]

  const txns = []
  let seq = 0
  const push = (t) =>
    txns.push({
      id: uid(),
      createdAt: seq++,
      accountId: 'a_bank',
      type: 'expense',
      name: '',
      amount: 0,
      categoryId: 'other_expense',
      date: toISODate(addDays(new Date(), -(t.daysAgo ?? 0))),
      recurring: null,
      parentId: null,
      ...t,
    })

  // ---- Transactions récurrentes (le store matérialisera les occurrences) ----
  const monthStart = toISODate(addDays(startOfMonth(new Date()), -62))
  push({ name: 'Salaire', amount: 2450, categoryId: 'salary', type: 'income', date: monthStart, recurring: { frequency: 'monthly', every: 1 } })
  push({ name: 'Loyer', amount: 780, categoryId: 'housing', date: toISODate(addDays(startOfMonth(new Date()), -60)), recurring: { frequency: 'monthly', every: 1 } })
  push({ name: 'Pass Navigo', amount: 86.4, categoryId: 'transport', date: toISODate(addDays(startOfMonth(new Date()), -58)), recurring: { frequency: 'monthly', every: 1 } })
  push({ name: 'Facture EDF', amount: 54, categoryId: 'utilities', date: toISODate(addDays(startOfMonth(new Date()), -55)), recurring: { frequency: 'monthly', every: 1 } })
  push({ name: 'Netflix', amount: 11.99, categoryId: 'subscriptions', date: toISODate(addDays(startOfMonth(new Date()), -51)), recurring: { frequency: 'monthly', every: 1 } })
  push({ name: 'Spotify', amount: 10.99, categoryId: 'subscriptions', date: toISODate(addDays(startOfMonth(new Date()), -53)), recurring: { frequency: 'monthly', every: 1 } })
  push({ name: 'Stockage iCloud', amount: 2.99, categoryId: 'subscriptions', date: toISODate(addDays(startOfMonth(new Date()), -54)), recurring: { frequency: 'monthly', every: 1 } })

  // ---- Dépenses ponctuelles (40 derniers jours) ----
  const expenses = [
    [40, 'Carrefour', 'groceries', 62.3],
    [39, 'Starbucks', 'restaurants', 5.6],
    [38, 'Ticket métro', 'transport', 1.9],
    [37, 'Lidl', 'groceries', 44.15],
    [36, 'Boulangerie', 'restaurants', 4.2],
    [35, 'Amazon', 'shopping', 29.99],
    [34, 'Brunch du dimanche', 'restaurants', 18],
    [33, 'Pharmacie', 'health', 8.4],
    [32, 'Vélib\'', 'transport', 3],
    [30, 'Monoprix', 'groceries', 71.8],
    [29, 'Sushi Shop', 'restaurants', 22.5],
    [28, 'Café crème', 'restaurants', 2.8],
    [27, 'OUIGO — Paris', 'travel', 39],
    [26, 'Kebab', 'restaurants', 9.5],
    [24, 'Marché', 'groceries', 38.9],
    [23, 'Cinéma UGC', 'fun', 11.9],
    [22, 'Pizza Margherita', 'restaurants', 16.9],
    [21, 'Mission freelance — logo', 'freelance', 350, 'income'],
    [20, 'Steam — jeu', 'fun', 19.99],
    [19, 'Zara', 'shopping', 59.95],
    [17, 'Burger & frites', 'restaurants', 12.5],
    [16, 'Carrefour', 'groceries', 58.6],
    [14, 'Bar entre amis', 'restaurants', 6.5],
    [13, 'Décathlon', 'shopping', 34.9],
    [12, 'Bowling', 'fun', 24],
    [12, 'Presse & croissant', 'restaurants', 3.8, 'a_cash'],
    [10, 'Café du matin', 'restaurants', 2.8],
    [10, 'Lidl', 'groceries', 82.45],
    [9, 'Boulangerie', 'restaurants', 4.2],
    [8, 'Consultation médecin', 'health', 25],
    [7, 'Marché — fruits', 'groceries', 14.2, 'a_cash'],
    [7, 'Kebab', 'restaurants', 9.5],
    [6, 'Marché bio', 'groceries', 47.3],
    [5, 'Cinéma UGC', 'fun', 11.9],
    [5, 'Pizza à emporter', 'restaurants', 14.9],
    [4, 'Transilien', 'transport', 7.3],
    [3, 'Monoprix', 'groceries', 66.1],
    [2, 'Boulangerie', 'restaurants', 3.5],
    [1, 'Sushi Shop', 'restaurants', 18.5],
    [0, 'Carrefour', 'groceries', 53.75],
    [0, 'Crêpe sucrée', 'restaurants', 4.6],
  ]

  for (const [daysAgo, name, categoryId, amount, typeOrAccount, maybeAccount] of expenses) {
    let type = 'expense'
    let accountId = 'a_bank'
    if (typeOrAccount === 'income') type = 'income'
    else if (typeOrAccount) accountId = typeOrAccount
    if (maybeAccount) accountId = maybeAccount
    push({ daysAgo, name, categoryId, amount, type, accountId })
  }

  const mStart = toISODate(startOfMonth(new Date()))
  const budgets = [
    { id: uid(), name: 'Courses', amount: 420, period: 'monthly', startDate: mStart, categoryIds: ['groceries'] },
    { id: uid(), name: 'Restaurant & café', amount: 160, period: 'monthly', startDate: mStart, categoryIds: ['restaurants'] },
    { id: uid(), name: 'Abonnements', amount: 30, period: 'monthly', startDate: mStart, categoryIds: ['subscriptions'] },
    { id: uid(), name: 'Loisirs', amount: 80, period: 'monthly', startDate: mStart, categoryIds: ['fun'] },
  ]

  return {
    settings: {
      theme: 'dark',
      accent: 'green',
      currency: 'EUR',
    },
    accounts,
    transactions: txns,
    budgets,
  }
}
