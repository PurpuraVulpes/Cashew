// ---------- Identifiants ----------
export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

// ---------- Dates ----------
export const pad = (n) => String(n).padStart(2, '0')

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDays(date, n) {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function addMonths(date, n) {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + n)
  // Évite le débordement (ex: 31 mars -> 31 avr -> 1 mai)
  if (d.getDate() < day) d.setDate(0)
  return d
}

export function addYears(date, n) {
  return addMonths(date, n * 12)
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date)
  d.setDate(1)
  return d
}

export function endOfMonth(date = new Date()) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  return d
}

export function daysBetween(aIso, bIso) {
  const a = parseISO(aIso)
  const b = parseISO(bIso)
  return Math.round((b - a) / 86400000)
}

const MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

const MONTHS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

export function formatDateLabel(iso) {
  const today = todayISO()
  const yesterday = toISODate(addDays(today, -1))
  if (iso === today) return "Aujourd'hui"
  if (iso === yesterday) return 'Hier'
  const d = parseISO(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${sameYear ? '' : ' ' + d.getFullYear()}`
}

export function formatShortDay(iso) {
  const d = parseISO(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function monthLongKey(iso) {
  const d = parseISO(iso)
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

export function weekdayLabel(iso) {
  return DAYS[parseISO(iso).getDay()]
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

// ---------- Couleurs ----------
export function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }) {
  const h = (n) => Math.round(n).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

// Mélange deux hex : t = 0 -> a, t = 1 -> b
export function mixHex(a, b, t) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  })
}

export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Luminance relative perçue
export function isLight(hex) {
  const { r, g, b } = hexToRgb(hex)
  const lin = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2] > 0.4
}

// ---------- Formatage des montants ----------
export function fmtMoney(amount, currency = 'EUR', opts = {}) {
  const value = Math.round(amount * 100) / 100
  const hasDecimals = Math.abs(value % 1) > 0.001
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: opts.force ? 2 : hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function fmtSigned(amount, currency, type) {
  const sign = type === 'income' ? '+' : '−'
  return `${sign}${fmtMoney(Math.abs(amount), currency)}`
}

export function fmtCompact(amount, currency = 'EUR') {
  const v = Math.abs(amount)
  if (v >= 1000) {
    const text = new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 1,
    }).format(amount / 1000)
    const cur = currency === 'EUR' ? '€' : ''
    return `${text} k${cur ? ' ' + cur : ''}`
  }
  return fmtMoney(amount, currency)
}

// --------- Sélecteurs de calcul ----------
export function accountBalance(account, txns) {
  let bal = account.initialBalance ?? 0
  for (const t of txns) {
    if (t.accountId !== account.id) continue
    bal += t.type === 'income' ? t.amount : -t.amount
  }
  return bal
}

export function totalBalance(accounts, txns) {
  return accounts
    .filter((a) => a.includeInTotal !== false)
    .reduce((sum, a) => sum + accountBalance(a, txns), 0)
}

export function inMonth(iso, monthDate) {
  const d = parseISO(iso)
  return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear()
}

export function periodSpent(txns, startISO, endISO, categoryIds = null) {
  return txns
    .filter((t) => {
      if (t.type !== 'expense') return false
      if (t.date < startISO || t.date > endISO) return false
      if (categoryIds && categoryIds.length && !categoryIds.includes(t.categoryId)) return false
      return true
    })
    .reduce((s, t) => s + t.amount, 0)
}

export function budgetWindow(budget, now = new Date()) {
  if (budget.period === 'oneoff') {
    const start = budget.startDate
    const end = budget.endDate || start
    return { start, end, label: 'Budget unique' }
  }
  const anchor = parseISO(budget.startDate)
  if (budget.period === 'weekly') {
    const diff = daysBetween(toISODate(anchor), toISODate(now))
    const elapsedWeeks = Math.floor(Math.max(0, diff) / 7)
    const s = addDays(anchor, elapsedWeeks * 7)
    const e = addDays(s, 6)
    return { start: toISODate(s), end: toISODate(e), label: 'Hebdomadaire' }
  }
  // mensuel
  const s = new Date(now.getFullYear(), now.getMonth(), anchor.getDate())
  if (s > now) s.setMonth(s.getMonth() - 1)
  const e = addMonths(s, 1)
  const eIso = toISODate(addDays(e, -1))
  return { start: toISODate(s), end: eIso, label: 'Mensuel' }
}

export function groupByDay(txns) {
  const groups = new Map()
  for (const t of [...txns].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)) {
    if (!groups.has(t.date)) groups.set(t.date, [])
    groups.get(t.date).push(t)
  }
  return [...groups.entries()]
}

// Série cumulative du solde sur [days] jours, avec le solde de départ avant la période
export function cumulativeSeries(accounts, txns, days) {
  const today = new Date()
  const start = addDays(today, -(days - 1))
  const startISO = toISODate(start)
  const initial = accounts
    .filter((a) => a.includeInTotal !== false)
    .reduce((s, a) => s + (a.initialBalance ?? 0), 0)
  let value = initial
  // Appliquer toutes les transactions avant la fenêtre
  const before = txns.filter((t) => t.date < startISO)
  for (const t of before) value += t.type === 'income' ? t.amount : -t.amount

  const points = []
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i)
    const iso = toISODate(d)
    for (const t of txns.filter((x) => x.date === iso)) {
      value += t.type === 'income' ? t.amount : -t.amount
    }
    points.push({ date: iso, value })
  }
  const windowNet = points[points.length - 1].value - points[0].value
  return { points, startValue: points[0].value, endValue: points[points.length - 1].value, net: windowNet }
}

export function categoryTotals(txns, monthDate, type = 'expense') {
  const map = new Map()
  for (const t of txns) {
    if (t.type !== type) continue
    if (!inMonth(t.date, monthDate)) continue
    map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount)
  }
  return map
}

export function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
