import { toISODate, addDays, addMonths, addYears, parseISO } from '../src/utils.js'

// Réplique de la matérialisation des récurrences pour les tests Node
export function materializeHelper(state) {
  const today = toISODate(new Date())
  const existing = new Set(
    state.transactions.filter((t) => t.parentId).map((t) => `${t.parentId}__${t.date}`),
  )
  const additions = []
  let idc = 0
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
        additions.push({ ...parent, id: `t_${idc++}`, date: iso, recurring: null, parentId: parent.id })
        existing.add(key)
      }
      cursor = step(cursor)
      guard++
    }
  }
  return { ...state, transactions: [...state.transactions, ...additions] }
}

export function totalsForMonth(state) {
  const now = new Date()
  let out = 0
  let inV = 0
  for (const t of state.transactions) {
    const d = parseISO(t.date)
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue
    if (t.type === 'income') inV += t.amount
    else out += t.amount
  }
  return { out, in: inV }
}
