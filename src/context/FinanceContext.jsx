import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { buildSeed, DEFAULT_WORK } from '../data/seed.js'
import { getTheme, applyThemeToDocument, DEFAULT_THEME_ID } from '../data/themes.js'
import { uid, monthKeyOf } from '../utils/helpers.js'

const KEY = 'cashew-clone-v1'

function init() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.transactions) && Array.isArray(data.accounts)) {
        // Fusionne avec le seed pour garantir tous les champs même après mise à jour du modèle
        const seed = buildSeed()
        return {
          accounts: Array.isArray(data.accounts) ? data.accounts : seed.accounts,
          categories: Array.isArray(data.categories) ? data.categories : seed.categories,
          transactions: Array.isArray(data.transactions) ? data.transactions : seed.transactions,
          budgets: Array.isArray(data.budgets) ? data.budgets : seed.budgets,
          goals: Array.isArray(data.goals) ? data.goals : seed.goals,
          recurring: Array.isArray(data.recurring) ? data.recurring : seed.recurring,
          shifts: Array.isArray(data.shifts) ? data.shifts : seed.shifts,
          work: data.work || seed.work,
          workTimer: data.workTimer || null,
          settings: { ...seed.settings, ...(data.settings || {}) },
        }
      }
    }
  } catch { /* ignore */ }
  return buildSeed()
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TX':
      return { ...state, transactions: [{ ...action.payload, id: uid() }, ...state.transactions] }
    case 'UPDATE_TX':
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.payload.id ? action.payload : t)) }
    case 'DELETE_TX':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload) }
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, { ...action.payload, id: uid() }] }
    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map((a) => (a.id === action.payload.id ? action.payload : a)) }
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
        transactions: state.transactions.filter((t) => t.accountId !== action.payload && t.toAccountId !== action.payload),
      }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, { ...action.payload, id: uid() }] }
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map((c) => (c.id === action.payload.id ? action.payload : c)) }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
        transactions: state.transactions.map((t) => (t.categoryId === action.payload ? { ...t, categoryId: null } : t)),
        budgets: state.budgets.filter((b) => b.categoryId !== action.payload),
      }
    case 'UPSERT_BUDGET': {
      const existing = state.budgets.find((b) => b.categoryId === action.payload.categoryId)
      if (existing) {
        return { ...state, budgets: state.budgets.map((b) => (b.id === existing.id ? { ...b, ...action.payload } : b)) }
      }
      return { ...state, budgets: [...state.budgets, { ...action.payload, id: uid(), period: 'monthly' }] }
    }
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.payload) }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, { ...action.payload, id: uid(), saved: Number(action.payload.saved) || 0 }] }
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map((g) => (g.id === action.payload.id ? action.payload : g)) }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload) }
    case 'ADD_RECURRING':
      return { ...state, recurring: [...state.recurring, { ...action.payload, id: uid() }] }
    case 'UPDATE_RECURRING':
      return { ...state, recurring: state.recurring.map((r) => (r.id === action.payload.id ? action.payload : r)) }
    case 'DELETE_RECURRING':
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.payload) }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'ADD_SHIFT':
      return { ...state, shifts: [...(state.shifts || []), { ...action.payload, id: uid() }] }
    case 'UPDATE_SHIFT':
      return { ...state, shifts: (state.shifts || []).map((s) => (s.id === action.payload.id ? action.payload : s)) }
    case 'DELETE_SHIFT':
      return { ...state, shifts: (state.shifts || []).filter((s) => s.id !== action.payload) }
    case 'UPDATE_WORK':
      return {
        ...state,
        work: {
          ...(state.work || DEFAULT_WORK),
          ...action.payload,
          rates: { ...(state.work?.rates || DEFAULT_WORK.rates), ...(action.payload.rates || {}) },
        },
      }
    case 'SET_TIMER':
      return { ...state, workTimer: action.payload }
    case 'RESET_SETTINGS':
      // Réinitialise apparence + préférences sans toucher aux données
      return { ...state, settings: { name: state.settings?.name || '', currency: 'EUR', theme: 'light', themeColor: 'emerald', hideBalances: false, defaultAccountId: '', weekStart: 'monday', widgets: { flow: true, mix: true, work: true, recent: true } } }
    case 'IMPORT':
      return action.payload
    case 'RESET':
      return buildSeed()
    case 'CLEAR_ALL':
      return {
        accounts: [], categories: [], transactions: [], budgets: [], goals: [], recurring: [],
        shifts: [], workTimer: null,
        work: state.work || { ...DEFAULT_WORK },
        settings: { ...state.settings },
      }
    default:
      return state
  }
}

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch { /* ignore */ }
  }, [state])

  useEffect(() => {
    const dark = state.settings?.theme === 'dark'
    document.documentElement.classList.toggle('dark', dark)
  }, [state.settings?.theme])

  // Applique la couleur du thème (variables CSS --color-brand-*)
  useEffect(() => {
    applyThemeToDocument(state.settings?.themeColor || DEFAULT_THEME_ID)
  }, [state.settings?.themeColor])

  const value = useMemo(() => {
    const accounts = Array.isArray(state.accounts) ? state.accounts : []
    const categories = Array.isArray(state.categories) ? state.categories : []
    const transactions = Array.isArray(state.transactions) ? state.transactions : []
    const budgets = Array.isArray(state.budgets) ? state.budgets : []
    const goals = Array.isArray(state.goals) ? state.goals : []
    const recurring = Array.isArray(state.recurring) ? state.recurring : []

    const accountById = Object.fromEntries(accounts.map((a) => [a.id, a]))
    const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))
    const theme = getTheme(state.settings?.themeColor || DEFAULT_THEME_ID)

    // Soldes calculés
    const balances = {}
    for (const a of accounts) balances[a.id] = Number(a.initialBalance) || 0
    for (const t of transactions) {
      const amt = Number(t.amount) || 0
      if (t.type === 'income') balances[t.accountId] = (balances[t.accountId] ?? 0) + amt
      else if (t.type === 'expense') balances[t.accountId] = (balances[t.accountId] ?? 0) - amt
      else if (t.type === 'transfer') {
        balances[t.accountId] = (balances[t.accountId] ?? 0) - amt
        if (t.toAccountId) balances[t.toAccountId] = (balances[t.toAccountId] ?? 0) + amt
      }
    }
    const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0)

    const txByMonth = (monthKey) => transactions.filter((t) => monthKeyOf(t.date) === monthKey)

    const monthStats = (monthKey) => {
      let income = 0, expense = 0
      for (const t of txByMonth(monthKey)) {
        if (t.type === 'income') income += Number(t.amount) || 0
        else if (t.type === 'expense') expense += Number(t.amount) || 0
      }
      return { income, expense, net: income - expense }
    }

    return {
      state, dispatch,
      accounts,
      categories,
      transactions,
      budgets,
      goals,
      recurring,
      shifts: state.shifts || [],
      work: { ...DEFAULT_WORK, ...(state.work || {}), rates: { ...DEFAULT_WORK.rates, ...(state.work?.rates || {}) } },
      workTimer: state.workTimer || null,
      settings: state.settings || { name: '', currency: 'EUR', theme: 'light', themeColor: 'emerald', hideBalances: false, defaultAccountId: '', weekStart: 'monday', widgets: {} },
      accountById, categoryById,
      balances, totalBalance,
      txByMonth, monthStats,
      theme, brand500: theme.shades[500],
    }
  }, [state])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
