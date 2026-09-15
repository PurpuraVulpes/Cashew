export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'USD', symbol: '$', label: 'Dollar américain ($)' },
  { code: 'GBP', symbol: '£', label: 'Livre sterling (£)' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc suisse' },
  { code: 'CAD', symbol: '$', label: 'Dollar canadien ($)' },
  { code: 'XOF', symbol: 'F', label: 'Franc CFA (F)' },
  { code: 'MAD', symbol: 'DH', label: 'Dirham marocain' },
]

export function formatMoney(amount, currency = 'EUR', opts = {}) {
  const n = Number(amount) || 0
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: opts.compact ? 1 : 2,
      minimumFractionDigits: opts.compact ? 0 : undefined,
      notation: opts.compact ? 'compact' : 'standard',
      ...opts,
    }).format(n)
  } catch {
    return `${n.toFixed(2)} ${currency}`
  }
}

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function parseISO(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function monthLabel(year, month /* 1-12 */, short = false) {
  const arr = short ? MONTHS_SHORT : MONTHS_FR
  const m = Number(month)
  if (!m || m < 1 || m > 12) return `${year || ''}`.trim()
  return `${arr[m - 1]} ${year}`
}

export function monthKeyOf(iso) {
  return String(iso).slice(0, 7) // YYYY-MM
}

export function currentMonthKey() {
  return todayISO().slice(0, 7)
}

export function shiftMonthKey(key, delta) {
  try {
    const [y, m] = String(key).split('-').map(Number)
    if (!y || !m) return currentMonthKey()
    const d = new Date(y, m - 1 + delta, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  } catch {
    return currentMonthKey()
  }
}

export function monthKeyLabel(key, short = false) {
  try {
    if (!key) return ''
    const [y, m] = String(key).split('-').map(Number)
    if (!y || !m) return String(key)
    return monthLabel(y, m, short)
  } catch {
    return String(key || '')
  }
}

export function dayLabel(iso) {
  const today = todayISO()
  const d = parseISO(iso)
  const yesterday = toISODate(new Date(Date.now() - 86400000))
  if (iso === today) return "Aujourd'hui"
  if (iso === yesterday) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function shortDate(iso) {
  return parseISO(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function fullDate(iso) {
  return parseISO(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 18) return 'Bonjour'
  return 'Bonsoir'
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function downloadFile(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function transactionsToCSV(rows) {
  const head = 'date;type;montant;compte;compte_destination;categorie;note'
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [r.date, r.type, String(r.amount).replace('.', ','), esc(r.account), esc(r.toAccount), esc(r.category), esc(r.note)].join(';')
  )
  return '\uFEFF' + head + '\n' + lines.join('\n')
}
