import React, { useEffect, useMemo, useState } from 'react'
import { Clock, Settings2 } from 'lucide-react'
import { Modal, Field, inputCls, Btn } from './ui.jsx'
import { useFinance } from '../context/FinanceContext.jsx'
import { SHIFT_TYPES, shiftMinutes, shiftPay, formatDuration } from '../utils/work.js'
import { todayISO } from '../utils/helpers.js'
import { Money } from './ui.jsx'

/* ---------- Saisie / modification d'une vacation ---------- */
export function ShiftModal({ open, onClose, editing = null, preset = {} }) {
  const { work, dispatch } = useFinance()
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState(work.defaultStart)
  const [end, setEnd] = useState(work.defaultEnd)
  const [breakMinutes, setBreakMinutes] = useState(work.defaultBreak)
  const [type, setType] = useState('normal')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setStart(editing.start)
      setEnd(editing.end)
      setBreakMinutes(editing.breakMinutes)
      setType(editing.type)
      setNote(editing.note || '')
    } else {
      setDate(preset.date || todayISO())
      setStart(preset.start || work.defaultStart)
      setEnd(preset.end || work.defaultEnd)
      setBreakMinutes(preset.breakMinutes ?? work.defaultBreak)
      setType(preset.type || 'normal')
      setNote(preset.note || '')
    }
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const draft = useMemo(
    () => ({ date, start, end, breakMinutes: Number(breakMinutes) || 0, type }),
    [date, start, end, breakMinutes, type]
  )
  const minutes = shiftMinutes(draft)
  const pay = shiftPay(draft, work)

  const submit = () => {
    if (!date) return setError('Choisissez une date.')
    if (!start || !end) return setError('Renseignez une heure de début et de fin.')
    if (minutes <= 0) return setError('La durée travaillée doit être supérieure à 0 (vérifiez les heures et la pause).')
    const payload = { date, start, end, breakMinutes: Number(breakMinutes) || 0, type, note: note.trim() }
    if (editing) dispatch({ type: 'UPDATE_SHIFT', payload: { ...editing, ...payload } })
    else dispatch({ type: 'ADD_SHIFT', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Modifier la vacation' : 'Nouvelle vacation'} subtitle="Saisissez vos horaires de travail">
      <div className="space-y-4">
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début">
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Fin">
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pause (minutes)">
            <input
              type="number" min="0" max="600" step="5"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Type d'heures">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {SHIFT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} (×{work.rates?.[t.id] ?? t.defaultMult})
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Note (optionnel)">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : Inventaire, remplacement…" className={inputCls} maxLength={60} />
        </Field>

        {/* Aperçu calculé */}
        <div className="flex items-center justify-between rounded-2xl bg-brand-500/10 px-4 py-3.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Clock className="h-4 w-4 text-brand-500" /> {formatDuration(minutes)} travaillées
          </div>
          <Money value={pay} className="text-lg font-extrabold text-brand-700 dark:text-brand-300" />
        </div>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>
        )}

        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>{editing ? 'Enregistrer' : 'Ajouter la vacation'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Configuration : taux horaire, majorations, défauts ---------- */
export function WorkConfigModal({ open, onClose }) {
  const { work, dispatch } = useFinance()
  const [hourlyRate, setHourlyRate] = useState('15.5')
  const [payDay, setPayDay] = useState(5)
  const [weeklyTarget, setWeeklyTarget] = useState(35)
  const [defaultStart, setDefaultStart] = useState('09:00')
  const [defaultEnd, setDefaultEnd] = useState('18:00')
  const [defaultBreak, setDefaultBreak] = useState(60)
  const [rates, setRates] = useState({})

  useEffect(() => {
    if (!open) return
    setHourlyRate(String(work.hourlyRate ?? ''))
    setPayDay(work.payDay ?? 5)
    setWeeklyTarget(work.weeklyTarget ?? 35)
    setDefaultStart(work.defaultStart || '09:00')
    setDefaultEnd(work.defaultEnd || '18:00')
    setDefaultBreak(work.defaultBreak ?? 60)
    setRates({ ...work.rates })
  }, [open, work])

  const submit = () => {
    const rate = Number(String(hourlyRate).replace(',', '.'))
    if (!rate || rate <= 0) return
    const cleanRates = {}
    for (const t of SHIFT_TYPES) {
      const v = Number(String(rates[t.id] ?? t.defaultMult).replace(',', '.'))
      cleanRates[t.id] = v > 0 ? v : t.defaultMult
    }
    dispatch({
      type: 'UPDATE_WORK',
      payload: {
        hourlyRate: Math.round(rate * 100) / 100,
        payDay: Math.min(28, Math.max(1, Number(payDay) || 5)),
        weeklyTarget: Math.max(0, Number(String(weeklyTarget).replace(',', '.')) || 0),
        defaultStart, defaultEnd,
        defaultBreak: Math.max(0, Number(defaultBreak) || 0),
        rates: cleanRates,
      },
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Paramètres de travail" subtitle="Taux horaire, majorations et horaires habituels" wide>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Taux horaire net">
            <input inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className={inputCls} placeholder="15,50" />
          </Field>
          <Field label="Paie vers le">
            <input type="number" min="1" max="28" value={payDay} onChange={(e) => setPayDay(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Objectif hebdo (h)">
            <input inputMode="decimal" value={weeklyTarget} onChange={(e) => setWeeklyTarget(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Majorations (multiplicateur)</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SHIFT_TYPES.filter((t) => t.id !== 'normal').map((t) => (
              <label key={t.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">{t.short}</span>
                <span className="mt-1.5 flex items-center gap-1">
                  <span className="text-sm font-extrabold text-slate-400">×</span>
                  <input
                    inputMode="decimal"
                    value={rates[t.id] ?? ''}
                    onChange={(e) => setRates({ ...rates, [t.id]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-extrabold outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </span>
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-slate-400">Ex : ×1,25 pour les heures sup. à +25 %, ×2 le dimanche.</p>
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Settings2 className="h-3.5 w-3.5" /> Horaires habituels (pré-remplissage)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Début">
              <input type="time" value={defaultStart} onChange={(e) => setDefaultStart(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fin">
              <input type="time" value={defaultEnd} onChange={(e) => setDefaultEnd(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Pause (min)">
              <input type="number" min="0" max="600" step="5" value={defaultBreak} onChange={(e) => setDefaultBreak(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>Enregistrer</Btn>
        </div>
      </div>
    </Modal>
  )
}
