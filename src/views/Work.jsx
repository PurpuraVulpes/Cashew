import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, Timer, Square, Play, Settings2,
  Pencil, Trash2, Copy, Briefcase, CalendarClock, Wallet, CircleAlert,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, ProgressBar, EmptyState, Btn } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { ShiftModal, WorkConfigModal } from '../components/WorkModals.jsx'
import { ConfirmModal } from '../components/Modals.jsx'
import {
  SHIFT_TYPES, SHIFT_TYPE_LABEL, shiftMinutes, shiftPay,
  formatDuration, formatElapsed, summarizeShifts, weekRangeISO, minutesToHHMM,
} from '../utils/work.js'
import {
  currentMonthKey, shiftMonthKey, monthKeyLabel, monthKeyOf,
  dayLabel, todayISO, toISODate, cx,
} from '../utils/helpers.js'

const TYPE_COLORS = {
  normal: '#0d9d6c', overtime25: '#f59e0b', overtime50: '#f97316', night: '#8b5cf6', sunday: '#ec4899',
}

export default function Work({ setView }) {
  const { shifts, work, workTimer, transactions, categoryById, settings, dispatch } = useFinance()
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [shiftOpen, setShiftOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [preset, setPreset] = useState({})
  const [configOpen, setConfigOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [now, setNow] = useState(Date.now())

  // Tick de la pointeuse
  useEffect(() => {
    if (!workTimer?.start) return
    const i = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(i)
  }, [workTimer])

  const list = useMemo(() => {
    return shifts
      .filter((s) => monthKeyOf(s.date) === monthKey)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.start < b.start ? 1 : -1)))
  }, [shifts, monthKey])

  const summary = useMemo(() => summarizeShifts(list, work), [list, work])

  // Semaine en cours (lundi → dimanche)
  const week = useMemo(() => {
    const { start, end } = weekRangeISO(new Date(), settings.weekStart || 'monday')
    const mins = shifts
      .filter((s) => s.date >= start && s.date <= end)
      .reduce((t, s) => t + shiftMinutes(s), 0)
    return { start, end, minutes: mins }
  }, [shifts])

  // Estimation versée le mois suivant + comparaison au salaire réellement perçu
  const payoutKey = shiftMonthKey(monthKey, 1)
  const salaryReceived = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && monthKeyOf(t.date) === payoutKey)
      .filter((t) => (categoryById[t.categoryId]?.name || '').toLowerCase().includes('salaire'))
      .reduce((t, x) => t + (Number(x.amount) || 0), 0)
  }, [transactions, payoutKey, categoryById])

  const noRate = !(Number(work.hourlyRate) > 0)

  const openAdd = (p = {}) => {
    setEditing(null)
    setPreset(p)
    setShiftOpen(true)
  }

  const startTimer = () => {
    dispatch({ type: 'SET_TIMER', payload: { start: new Date().toISOString() } })
  }

  const stopTimer = () => {
    if (!workTimer?.start) return
    const t0 = new Date(workTimer.start)
    const t1 = new Date()
    const startHHMM = `${String(t0.getHours()).padStart(2, '0')}:${String(t0.getMinutes()).padStart(2, '0')}`
    const endHHMM = `${String(t1.getHours()).padStart(2, '0')}:${String(t1.getMinutes()).padStart(2, '0')}`
    dispatch({ type: 'SET_TIMER', payload: null })
    setMonthKey(monthKeyOf(toISODate(t0)))
    openAdd({ date: toISODate(t0), start: startHHMM, end: endHHMM })
  }

  const duplicate = (s) => {
    setEditing(null)
    setPreset({ date: s.date, start: s.start, end: s.end, breakMinutes: s.breakMinutes, type: s.type, note: s.note })
    setShiftOpen(true)
  }

  const avgPerShift = summary.count > 0 ? summary.minutes / summary.count : 0

  return (
    <div>
      <MobileHeader
        title="Travail"
        subtitle={`Estimation paie · ${monthKeyLabel(...payoutKey.split('-').map(Number))}`}
        onProfile={() => setView('settings')}
        right={
          <button onClick={() => setConfigOpen(true)} className="rounded-full bg-slate-100 p-2.5 dark:bg-white/10" aria-label="Paramètres de travail">
            <Settings2 className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
          </button>
        }
      />
      <PageHeader
        title="Travail & horaires"
        subtitle="Suivez vos heures et estimez votre prochaine paie"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setConfigOpen(true)}><Settings2 className="h-4 w-4" /> Taux & paramètres</Btn>
            <Btn onClick={() => openAdd()}><Plus className="h-4 w-4" /> Ajouter des heures</Btn>
          </div>
        }
      />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        {noRate && (
          <Card className="flex items-center gap-3 border-amber-400/40 bg-amber-50 p-4 dark:bg-amber-500/10">
            <CircleAlert className="h-8 w-8 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Définissez votre taux horaire</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Indispensable pour estimer vos gains.</p>
            </div>
            <Btn className="!py-2.5 text-xs" onClick={() => setConfigOpen(true)}>Configurer</Btn>
          </Card>
        )}

        {/* Pointeuse */}
        <Card className={cx('p-5', workTimer?.start && 'border-brand-500/50 ring-2 ring-brand-500/20')}>
          <div className="flex items-center gap-4">
            <span className={cx(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
              workTimer?.start ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'
            )}>
              <Timer className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              {workTimer?.start ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                    Vacation en cours · depuis {minutesToHHMM((new Date(workTimer.start).getHours() * 60) + new Date(workTimer.start).getMinutes())}
                  </p>
                  <p className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                    {formatElapsed(now - new Date(workTimer.start).getTime())}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-extrabold text-slate-900 dark:text-white">Pointeuse</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Démarrez le chrono à l'embauche, arrêtez à la débauche.</p>
                </>
              )}
            </div>
            {workTimer?.start ? (
              <Btn onClick={stopTimer} className="!bg-rose-500 shadow-rose-500/25 hover:!bg-rose-600">
                <Square className="h-4 w-4" /> Stop
              </Btn>
            ) : (
              <Btn onClick={startTimer}><Play className="h-4 w-4" /> Pointer</Btn>
            )}
          </div>
        </Card>

        {/* Sélecteur mois */}
        <Card className="flex items-center justify-between p-2">
          <button onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))} className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Mois précédent">
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button onClick={() => setMonthKey(currentMonthKey())} className="text-[15px] font-extrabold capitalize text-slate-900 dark:text-white">
            {monthKeyLabel(...monthKey.split('-').map(Number))}
          </button>
          <button onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))} className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Mois suivant">
            <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        </Card>

        {/* Estimation paie du mois suivant */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400 p-6 text-white shadow-xl shadow-brand-500/25">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-white/10" />
          <p className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
            <CalendarClock className="h-4 w-4" />
            Salaire estimé · versé vers le {work.payDay} {monthKeyLabel(...payoutKey.split('-').map(Number))}
          </p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums"><Money value={summary.pay} /></p>
          <p className="mt-1 text-sm font-semibold text-white/85">
            pour {formatDuration(summary.minutes)} travaillées · {summary.count} vacation{summary.count > 1 ? 's' : ''}
          </p>
          {salaryReceived > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-950/20 px-4 py-2.5 text-sm backdrop-blur">
              <span className="font-semibold text-white/85">Salaire perçu ce mois-là</span>
              <span className="font-extrabold"><Money value={salaryReceived} /> {salaryReceived >= summary.pay ? '✅' : '⚠️'}</span>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="p-3.5 text-center">
            <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400"><Briefcase className="h-3 w-3" /> Heures</p>
            <p className="mt-0.5 text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{formatDuration(summary.minutes)}</p>
          </Card>
          <Card className="p-3.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Vacations</p>
            <p className="mt-0.5 text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{summary.count}</p>
          </Card>
          <Card className="p-3.5 text-center">
            <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400"><Wallet className="h-3 w-3" /> Taux horaire</p>
            <Money value={work.hourlyRate} className="mt-0.5 block text-lg font-extrabold text-slate-900 dark:text-white" />
          </Card>
        </div>

        {/* Semaine en cours */}
        {Number(work.weeklyTarget) > 0 && (
          <Card className="p-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-extrabold text-slate-900 dark:text-white">Cette semaine</span>
              <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatDuration(week.minutes)} <span className="font-semibold text-slate-400">/ {work.weeklyTarget}h</span>
              </span>
            </div>
            <ProgressBar value={week.minutes / 60} max={Number(work.weeklyTarget)} />
            <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Moyenne par vacation ce mois-ci : {formatDuration(avgPerShift)}
            </p>
          </Card>
        )}

        {/* Détail par type d'heures */}
        {Object.keys(summary.byType).length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 font-extrabold text-slate-900 dark:text-white">Détail par type d'heures</h3>
            <div className="space-y-2.5">
              {SHIFT_TYPES.filter((t) => summary.byType[t.id]).map((t) => {
                const d = summary.byType[t.id]
                const color = TYPE_COLORS[t.id] || '#64748b'
                return (
                  <div key={t.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {t.label}
                      </span>
                      <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatDuration(d.minutes)} · <Money value={d.pay} />
                      </span>
                    </div>
                    <ProgressBar value={d.minutes} max={summary.minutes} color={color} />
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Liste des vacations */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white">Vacations du mois</h3>
            <button onClick={() => openAdd()} className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
          {list.length === 0 ? (
            <Card>
              <EmptyState
                icon="salary"
                title="Aucune vacation"
                hint="Saisissez vos horaires ou utilisez la pointeuse pour estimer votre paie."
                action={<Btn onClick={() => openAdd()}><Plus className="h-4 w-4" /> Ajouter des heures</Btn>}
              />
            </Card>
          ) : (
            <Card className="divide-y divide-slate-100 px-2 dark:divide-white/5">
              {list.map((s) => {
                const color = TYPE_COLORS[s.type] || '#64748b'
                const isToday = s.date === todayISO()
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl leading-none" style={{ backgroundColor: color + '1f', color }}>
                      <span className="text-base font-extrabold">{s.date.slice(8, 10)}</span>
                      <span className="text-[9px] font-bold uppercase">{['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'][Number(s.date.slice(5, 7)) - 1]}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {isToday ? "Aujourd'hui · " : ''}{dayLabel(s.date).split(',')[0]}
                        <span className="font-semibold text-slate-400"> · {s.start}–{s.end}</span>
                      </p>
                      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        {SHIFT_TYPE_LABEL[s.type]}{s.breakMinutes > 0 ? ` · pause ${s.breakMinutes} min` : ''}{s.note ? ` · ${s.note}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">{formatDuration(shiftMinutes(s))}</p>
                      <Money value={shiftPay(s, work)} className="text-xs font-bold text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button onClick={() => { setEditing(s); setPreset({}); setShiftOpen(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10" aria-label="Modifier">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => duplicate(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10" aria-label="Dupliquer">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleting(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" aria-label="Supprimer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      </div>

      <ShiftModal open={shiftOpen} onClose={() => setShiftOpen(false)} editing={editing} preset={preset} />
      <WorkConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer cette vacation ?"
        message="Ses heures ne seront plus comptées dans l'estimation de paie."
        onConfirm={() => dispatch({ type: 'DELETE_SHIFT', payload: deleting.id })}
      />
    </div>
  )
}
