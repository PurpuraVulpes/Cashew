import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Eye, EyeOff, ArrowUpRight, ArrowDownRight, ChevronRight, Plus,
  ArrowLeftRight, Target, PiggyBank, TrendingUp, Briefcase,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, ProgressBar, EmptyState, IconBadge } from '../components/ui.jsx'
import { currentMonthKey, shiftMonthKey, monthKeyLabel, monthKeyOf, greeting, shortDate, toISODate, todayISO, cx, CURRENCIES } from '../utils/helpers.js'
import { summarizeShifts, formatDuration } from '../utils/work.js'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'

export function TxRow({ tx, onClick }) {
  const { accountById, categoryById } = useFinance()
  const acc = accountById[tx.accountId]
  const cat = categoryById[tx.categoryId]
  const isTransfer = tx.type === 'transfer'
  const toAcc = isTransfer ? accountById[tx.toAccountId] : null
  const color = isTransfer ? '#0ea5e9' : cat?.color || '#64748b'
  const icon = isTransfer ? 'transfer' : cat?.icon || 'dots'
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-slate-50 active:scale-[.995] dark:hover:bg-white/5">
      {isTransfer ? (
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.08)]" style={{ backgroundColor: '#0ea5e91f', color: '#0ea5e9' }}>
          <ArrowLeftRight className="h-5 w-5" />
        </span>
      ) : (
        <IconBadge icon={icon} color={color} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
          {isTransfer ? `Virement → ${toAcc?.name || '?'}` : tx.note || cat?.name || 'Sans catégorie'}
        </span>
        <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          {isTransfer ? acc?.name : `${cat?.name || ''} · ${acc?.name || ''}`}
        </span>
      </span>
      <Money
        value={tx.type === 'expense' ? -tx.amount : tx.type === 'income' ? tx.amount : tx.amount}
        signed={!isTransfer}
        className={cx('text-sm font-extrabold', isTransfer ? 'text-sky-500' : 'text-slate-900 dark:text-white')}
      />
    </button>
  )
}

function SavingsRing({ rate }) {
  const R = 22
  const C = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(100, rate))
  return (
    <span className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="7" />
        <circle
          cx="28" cy="28" r={R} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className="text-sm font-extrabold tabular-nums">{Math.round(pct)}<span className="text-[10px]">%</span></span>
    </span>
  )
}

// Compteur animé (respecte "réduire les animations")
function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const from = prev.current
    const to = value
    if (from === to) return
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(to)
      prev.current = to
      return
    }
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      prev.current = to
    }
  }, [value, duration])
  return display
}

export default function Dashboard({ setView, onAdd, onEditTx }) {
  const { transactions, budgets, categoryById, settings, totalBalance, monthStats, dispatch, brand500, shifts, work, recurring } = useFinance()
  const [monthKey] = useState(currentMonthKey())
  const stats = monthStats(monthKey)
  const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || settings.currency
  const animatedBalance = useCountUp(totalBalance)

  // Widgets affichés (personnalisables dans Paramètres)
  const widgets = settings.widgets || {}
  const show = (k) => widgets[k] ?? true

  const workSummary = useMemo(
    () => summarizeShifts(shifts.filter((s) => monthKeyOf(s.date) === monthKey), work),
    [shifts, monthKey, work]
  )
  const payoutKey = shiftMonthKey(monthKey, 1)

  // Projection de fin de mois : solde + échéances restantes prévues
  const projection = useMemo(() => {
    const today = todayISO()
    const [y, m] = monthKey.split('-').map(Number)
    const endOfMonth = `${monthKey}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
    let delta = 0
    for (const r of recurring.filter((x) => x.active && x.nextDate >= today && x.nextDate <= endOfMonth)) {
      delta += (r.type === 'income' ? 1 : -1) * (Number(r.amount) || 0)
    }
    return totalBalance + delta
  }, [recurring, totalBalance, monthKey])

  const last30 = useMemo(() => {
    const days = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      days.push({ iso: toISODate(d), label: shortDate(toISODate(d)), depenses: 0, revenus: 0 })
    }
    const map = Object.fromEntries(days.map((d) => [d.iso, d]))
    for (const t of transactions) {
      const day = map[t.date?.slice(0, 10)]
      if (!day) continue
      if (t.type === 'expense') day.depenses += Number(t.amount) || 0
      else if (t.type === 'income') day.revenus += Number(t.amount) || 0
    }
    return days
  }, [transactions])

  const donut = useMemo(() => {
    const byCat = {}
    for (const t of transactions.filter((t) => monthKeyOf(t.date) === monthKey && t.type === 'expense')) {
      byCat[t.categoryId || 'none'] = (byCat[t.categoryId || 'none'] || 0) + (Number(t.amount) || 0)
    }
    return Object.entries(byCat)
      .map(([id, value]) => ({ id, name: categoryById[id]?.name || 'Autre', value: Math.round(value * 100) / 100, color: categoryById[id]?.color || '#64748b' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [transactions, monthKey, categoryById])

  const spentByCat = useMemo(() => {
    const m = {}
    for (const t of transactions.filter((t) => monthKeyOf(t.date) === monthKey && t.type === 'expense')) {
      m[t.categoryId] = (m[t.categoryId] || 0) + (Number(t.amount) || 0)
    }
    return m
  }, [transactions, monthKey])

  const recent = useMemo(() => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6), [transactions])
  const topBudgets = budgets.slice(0, 3)
  const savingsRate = stats.income > 0 ? Math.max(0, Math.round(((stats.income - stats.expense) / stats.income) * 100)) : 0

  return (
    <div>
      <MobileHeader
        title={`${greeting()}, ${settings.name || 'ami'} 👋`}
        subtitle="Voici l'état de vos finances"
        onProfile={() => setView('settings')}
      />
      <PageHeader title={`${greeting()}, ${settings.name || 'ami'} 👋`} subtitle="Voici l'état de vos finances ce mois-ci" />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        {/* Solde */}
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400 p-6 text-white shadow-xl shadow-brand-500/30 ring-1 ring-white/20">
          <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10 blur-[1px]" />
          <div className="pointer-events-none absolute -bottom-24 right-28 h-52 w-52 rounded-full bg-white/10 blur-[1px]" />
          <div className="pointer-events-none absolute -top-1/3 left-1/4 h-full w-24 rotate-12 bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="relative flex items-center justify-between">
            <p className="text-sm font-semibold text-white/80">Solde total · tous comptes</p>
            <button
              onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { hideBalances: !settings.hideBalances } })}
              className="rounded-full bg-white/15 p-2 transition hover:bg-white/25 active:scale-90"
              aria-label="Masquer les montants"
            >
              {settings.hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="relative mt-1 text-[2.6rem] font-extrabold leading-none tracking-tight tabular-nums">
            {settings.hideBalances ? '••••••' : <Money value={animatedBalance} />}
          </p>
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/15 backdrop-blur">
              <p className="flex items-center gap-1.5 text-xs font-bold text-white/85">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25"><ArrowDownRight className="h-3.5 w-3.5" /></span>
                Revenus
              </p>
              <p className="mt-1.5 truncate text-lg font-extrabold tabular-nums">{settings.hideBalances ? '•••' : <Money value={stats.income} />}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/15 backdrop-blur">
              <p className="flex items-center gap-1.5 text-xs font-bold text-white/85">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25"><ArrowUpRight className="h-3.5 w-3.5" /></span>
                Dépenses
              </p>
              <p className="mt-1.5 truncate text-lg font-extrabold tabular-nums">{settings.hideBalances ? '•••' : <Money value={stats.expense} />}</p>
            </div>
          </div>
          <div className="relative mt-3 flex items-center gap-4 rounded-2xl bg-slate-950/20 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
            <SavingsRing rate={savingsRate} />
            <div className="min-w-0">
              <p className="text-sm font-extrabold">Taux d'épargne</p>
              <p className="truncate text-xs font-medium text-white/75">
                {savingsRate >= 20 ? 'Excellent, continuez ! 🎉' : savingsRate >= 10 ? 'En bonne voie 💪' : 'Chaque euro compte 🌱'}
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-white/90">
                Net : <Money value={stats.net} signed /> · Fin de mois ≈ {settings.hideBalances ? '•••' : <Money value={projection} />}
              </p>
            </div>
          </div>
        </div>

        {/* Flux 30 jours */}
        {show('flow') && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Flux des 30 derniers jours</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Dépenses vs revenus par jour</p>
              </div>
              <button onClick={() => setView('stats')} className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-slate-300">
                Détails <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last30} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={brand500} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={brand500} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    formatter={(v, name) => [`${Math.round(v * 100) / 100} ${currencySymbol}`, name === 'depenses' ? 'Dépenses' : 'Revenus']}
                    labelFormatter={(l) => l}
                    contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.12)', fontSize: 12, fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="revenus" stroke={brand500} strokeWidth={2.5} fill="url(#gRev)" />
                  <Area type="monotone" dataKey="depenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gDep)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {show('mix') && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Budgets */}
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900 dark:text-white"><Target className="h-4 w-4 text-brand-500" /> Budgets du mois</h3>
                <button onClick={() => setView('budgets')} className="text-xs font-bold text-brand-600 transition hover:opacity-80 dark:text-brand-400">Tout voir</button>
              </div>
              {topBudgets.length === 0 ? (
                <EmptyState icon="money" title="Aucun budget" hint="Créez votre premier budget mensuel pour garder le cap." action={<button onClick={() => setView('budgets')} className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white transition active:scale-95">Créer un budget</button>} />
              ) : (
                <div className="space-y-3">
                  {topBudgets.map((b) => {
                    const spent = b.categoryId === 'all' ? stats.expense : spentByCat[b.categoryId] || 0
                    const name = b.categoryId === 'all' ? 'Budget global' : categoryById[b.categoryId]?.name || 'Catégorie'
                    const color = b.categoryId === 'all' ? brand500 : categoryById[b.categoryId]?.color || brand500
                    return (
                      <div key={b.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{name}</span>
                          <span className="font-extrabold tabular-nums text-slate-900 dark:text-white"><Money value={spent} compact /> <span className="font-semibold text-slate-400">/ <Money value={b.amount} compact /></span></span>
                        </div>
                        <ProgressBar value={spent} max={b.amount} color={color} />
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Donut */}
            <Card className="p-5">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Dépenses par catégorie</h3>
                <button onClick={() => setView('stats')} className="text-xs font-bold text-brand-600 transition hover:opacity-80 dark:text-brand-400">Stats</button>
              </div>
              {donut.length === 0 ? (
                <EmptyState icon="chart" title="Pas encore de dépenses" hint="Ajoutez votre première dépense pour voir la répartition." />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-36 w-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donut} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                          {donut.map((d) => <Cell key={d.id} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} ${currencySymbol}`, '']} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, fontWeight: 700 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {donut.slice(0, 4).map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="flex-1 truncate font-semibold text-slate-600 dark:text-slate-300">{d.name}</span>
                        <span className="font-extrabold tabular-nums text-slate-900 dark:text-white"><Money value={d.value} compact /></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: 'Dépense', icon: ArrowUpRight, color: '#f43f5e', bg: 'bg-rose-500/10', fn: () => onAdd('expense') },
            { label: 'Revenu', icon: ArrowDownRight, color: brand500, bg: 'bg-brand-500/10', fn: () => onAdd('income') },
            { label: 'Virement', icon: ArrowLeftRight, color: '#0ea5e9', bg: 'bg-sky-500/10', fn: () => onAdd('transfer') },
            { label: 'Objectif', icon: PiggyBank, color: '#8b5cf6', bg: 'bg-violet-500/10', fn: () => setView('goals') },
          ].map((a) => (
            <button key={a.label} onClick={a.fn} className="lift flex flex-col items-center gap-1.5 rounded-3xl border border-slate-200/70 bg-white p-3.5 transition active:scale-95 dark:border-white/10 dark:bg-[#131a17]">
              <span className={cx('flex h-10 w-10 items-center justify-center rounded-2xl', a.bg)} style={{ color: a.color }}>
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Travail — estimation paie */}
        {show('work') && (
          <button onClick={() => setView('work')} className="lift flex w-full items-center gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition active:scale-[.99] dark:border-white/10 dark:bg-[#131a17]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Briefcase className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                Paie estimée · <Money value={workSummary.pay} />
              </span>
              <span className="block truncate text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
                {formatDuration(workSummary.minutes)} en {monthKeyLabel(monthKey)} → vers le {work.payDay} {monthKeyLabel(payoutKey)}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
          </button>
        )}

        {/* Récentes */}
        {show('recent') && (
          <Card className="p-3">
            <div className="flex items-center justify-between px-2 pb-1 pt-2">
              <h3 className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900 dark:text-white"><TrendingUp className="h-4 w-4 text-brand-500" /> Opérations récentes</h3>
              <button onClick={() => setView('transactions')} className="flex items-center gap-0.5 text-xs font-bold text-brand-600 dark:text-brand-400">Tout voir <ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
            {recent.length === 0 ? (
              <EmptyState icon="wallet" title="Aucune opération" hint="Ajoutez votre première dépense ou revenu." action={<button onClick={() => onAdd()} className="flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white transition active:scale-95"><Plus className="h-3.5 w-3.5" /> Ajouter</button>} />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {recent.map((t) => <TxRow key={t.id} tx={t} onClick={() => onEditTx(t)} />)}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
