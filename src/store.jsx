import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { buildSeedState } from './seed.js'
import { uid, toISODate, addDays, addMonths, addYears, parseISO } from './utils.js'

const STORAGE_KEY = 'cashew-app-v1'

const StoreCtx = createContext(null)

// Matérialise les occurrences dues des transactions récurrentes
function materializeRecurring(state) {
  const today = toISODate(new Date())
  const existing = new Set(
    state.transactions.filter((t) => t.parentId).map((t) => `${t.parentId}__${t.date}`),
  )
  const additions = []
  for (const parent of state.transactions) {
    if (!parent.recurring || parent.parentId) continue
    const step = (date) => {
      const f = parent.recurring.frequency
      if (f === 'weekly') return addDays(date, 7 * (parent.recurring.every || 1))
      if (f === 'yearly') return addYears(date, parent.recurring.every || 1)
      return addMonths(date, parent.recurring.every || 1)
    }
    let cursor = step(parseISO(parent.date))
    let guard = 0
    while (toISODate(cursor) <= today && guard < 500) {
      const iso = toISODate(cursor)
      const key = `${parent.id}__${iso}`
      if (!existing.has(key)) {
        additions.push({
          ...parent,
          id: uid(),
          date: iso,
          recurring: null,
          parentId: parent.id,
          createdAt: Date.now() + additions.length,
        })
        existing.add(key)
      }
      cursor = step(cursor)
      guard++
    }
  }
  if (!additions.length) return state
  return { ...state, transactions: [...state.transactions, ...additions] }
}

function init() {
  let state
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      state = JSON.parse(raw)
      // Migrations légères
      state.settings = {
        theme: 'dark',
        accent: 'green',
        style: 'default',
        currency: 'EUR',
        ...state.settings,
      }
    } else {
      state = buildSeedState()
    }
  } catch {
    state = buildSeedState()
  }
  return materializeRecurring(state)
}

function reducer(state, action) {
  switch (action.type) {
    case 'tx/add': {
      const tx = { id: uid(), parentId: null, recurring: null, createdAt: Date.now(), ...action.tx }
      // On matérialise tout de suite les occurrences dues d'une récurrence passée
      return materializeRecurring({ ...state, transactions: [...state.transactions, tx] })
    }
    case 'tx/update':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }
    case 'tx/delete':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }

    case 'acc/add': {
      const acc = { id: uid(), initialBalance: 0, includeInTotal: true, emoji: '💳', color: '#4a90e2', ...action.acc }
      return { ...state, accounts: [...state.accounts, acc] }
    }
    case 'acc/update':
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
      }
    case 'acc/delete':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.id),
        transactions: state.transactions.filter((t) => t.accountId !== action.id),
      }

    case 'bud/add': {
      const bud = { id: uid(), period: 'monthly', categoryIds: [], ...action.bud }
      return { ...state, budgets: [...state.budgets, bud] }
    }
    case 'bud/update':
      return {
        ...state,
        budgets: state.budgets.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)),
      }
    case 'bud/delete':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) }

    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'import':
      return materializeRecurring(action.state)
    case 'reset':
      return materializeRecurring(buildSeedState())
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* quota dépassé : on ignore */
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore doit être utilisé dans StoreProvider')
  return ctx
}
