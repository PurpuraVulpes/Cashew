import { toISODate } from './helpers.js'

// Types de vacations et leurs multiplicateurs par défaut
export const SHIFT_TYPES = [
  { id: 'normal', label: 'Heures normales', short: 'Normal', defaultMult: 1 },
  { id: 'overtime25', label: 'Heures sup. +25 %', short: '+25 %', defaultMult: 1.25 },
  { id: 'overtime50', label: 'Heures sup. +50 %', short: '+50 %', defaultMult: 1.5 },
  { id: 'night', label: 'Heures de nuit', short: 'Nuit', defaultMult: 1.15 },
  { id: 'sunday', label: 'Dimanche / jour férié', short: 'Dim./férié', defaultMult: 2 },
]

export const SHIFT_TYPE_LABEL = Object.fromEntries(SHIFT_TYPES.map((t) => [t.id, t.label]))

export function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function minutesToHHMM(min) {
  const v = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
}

// Durée d'une vacation en minutes (pause déduite, gère le chevauchement sur 2 jours)
export function shiftMinutes(s) {
  const a = toMinutes(s.start)
  const b = toMinutes(s.end)
  if (a == null || b == null) return 0
  let d = b - a
  if (d <= 0) d += 24 * 60
  return Math.max(0, d - (Number(s.breakMinutes) || 0))
}

// Paie estimée d'une vacation
export function shiftPay(s, work) {
  const mult = Number(work?.rates?.[s.type] ?? 1) || 0
  const rate = Number(work?.hourlyRate) || 0
  return (shiftMinutes(s) / 60) * rate * mult
}

// "7h30"
export function formatDuration(totalMin) {
  const min = Math.max(0, Math.round(totalMin))
  const h = Math.floor(min / 60)
  return `${h}h${String(min % 60).padStart(2, '0')}`
}

// "02:14:05" pour la pointeuse
export function formatElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':')
}

export function summarizeShifts(list, work) {
  let minutes = 0
  let pay = 0
  const byType = {}
  for (const s of list) {
    const mn = shiftMinutes(s)
    const p = shiftPay(s, work)
    minutes += mn
    pay += p
    if (!byType[s.type]) byType[s.type] = { minutes: 0, pay: 0 }
    byType[s.type].minutes += mn
    byType[s.type].pay += p
  }
  return { minutes, pay: Math.round(pay * 100) / 100, count: list.length, byType }
}

// Semaine de 7 jours contenant la date de référence (ISO).
// weekStart: 'monday' (lun → dim) ou 'sunday' (dim → sam)
export function weekRangeISO(ref = new Date(), weekStart = 'monday') {
  const d = new Date(ref)
  const jsDay = d.getDay() // 0 = dimanche
  const offset = weekStart === 'sunday' ? jsDay : (jsDay + 6) % 7
  const first = new Date(d)
  first.setDate(d.getDate() - offset)
  const last = new Date(first)
  last.setDate(first.getDate() + 6)
  return { start: toISODate(first), end: toISODate(last) }
}
