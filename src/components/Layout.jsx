import React from 'react'
import {
  LayoutDashboard, ArrowLeftRight, ChartPie, Wallet, PiggyBank, Repeat2,
  Shapes, Settings, Plus, X, Target, Briefcase, Lock,
} from 'lucide-react'
import { cx } from '../utils/helpers.js'
import { useFinance } from '../context/FinanceContext.jsx'
import { useLock } from '../context/LockContext.jsx'
import { Avatar } from './ui.jsx'

export const NAV = [
  { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'stats', label: 'Statistiques', icon: ChartPie },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'work', label: 'Travail', icon: Briefcase },
  { id: 'accounts', label: 'Comptes', icon: Wallet },
  { id: 'goals', label: 'Objectifs', icon: PiggyBank },
  { id: 'recurring', label: 'Abonnements', icon: Repeat2 },
  { id: 'categories', label: 'Catégories', icon: Shapes },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

export function Sidebar({ view, setView, onAdd }) {
  const { settings } = useFinance()
  const lock = useLock()
  return (
    <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col border-r border-slate-200/60 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1412]/80 lg:flex">
      <button onClick={() => setView('dashboard')} className="group flex items-center gap-3 rounded-2xl px-2 py-3 text-left">
        <span className="anim-float flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-2xl shadow-lg shadow-brand-500/30 ring-1 ring-white/30">
          🥜
        </span>
        <span>
          <span className="block text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">Cashew</span>
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Mes finances sereines</span>
        </span>
      </button>

      <p className="px-3.5 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Menu</p>
      <nav className="mt-1 flex-1 space-y-1 overflow-y-auto">
        {NAV.map((n) => {
          const Icon = n.icon
          const active = view === n.id
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-all',
                active
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {n.label}
            </button>
          )
        })}
      </nav>

      <button
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-500/40 bg-brand-500/5 px-4 py-3 text-sm font-extrabold text-brand-700 transition hover:border-brand-500 hover:bg-brand-500/10 hover:shadow-lg hover:shadow-brand-500/10 active:scale-[.98] dark:text-brand-300"
      >
        <Plus className="h-5 w-5" /> Nouvelle opération
      </button>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-900/[.04] p-3 ring-1 ring-slate-900/5 dark:bg-white/5 dark:ring-white/10">
        <Avatar name={settings.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">{settings.name || 'Utilisateur'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Compte personnel</p>
        </div>
        {lock.enabled && (
          <button
            onClick={() => lock.lock()}
            className="rounded-xl bg-slate-900/5 p-2.5 text-slate-500 transition hover:bg-slate-900/10 hover:text-slate-700 active:scale-90 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
            aria-label="Verrouiller l'application"
            title="Verrouiller"
          >
            <Lock className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}

const TABS = [
  { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
  { id: 'transactions', label: 'Opérations', icon: ArrowLeftRight },
  { id: 'add', label: '+', icon: Plus },
  { id: 'stats', label: 'Stats', icon: ChartPie },
  { id: 'more', label: 'Plus', icon: Shapes },
]

export function BottomNav({ view, setView, onAdd, onMore }) {
  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden">
      <div className="anim-rise mx-auto grid max-w-md grid-cols-5 rounded-[1.75rem] border border-slate-200/60 bg-white/85 px-2 shadow-[0_16px_44px_-8px_rgba(15,23,42,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101613]/90 dark:shadow-[0_16px_44px_-8px_rgba(0,0,0,0.6)]">
        {TABS.map((t) => {
          if (t.id === 'add') {
            return (
              <div key="add" className="flex justify-center py-1.5">
                <button
                  onClick={() => { try { navigator.vibrate?.(10) } catch { /* ignore */ } onAdd() }}
                  aria-label="Ajouter"
                  className="flex h-14 w-14 -translate-y-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-xl shadow-brand-500/40 ring-4 ring-white/60 transition active:scale-90 dark:ring-white/10"
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} />
                </button>
              </div>
            )
          }
          const Icon = t.icon
          const active = view === t.id || (t.id === 'more' && ['budgets', 'work', 'accounts', 'goals', 'recurring', 'categories', 'settings'].includes(view))
          return (
            <div key={t.id} className="flex justify-center py-1.5">
              <button
                onClick={() => (t.id === 'more' ? onMore() : setView(t.id))}
                className={cx(
                  'flex w-full flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold transition active:scale-95',
                  active ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                {t.label}
              </button>
            </div>
          )
        })}
      </div>
    </nav>
  )
}

export function MobileHeader({ title, subtitle, right, onProfile }) {
  const { settings } = useFinance()
  return (
    <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200/50 bg-[#f3f5f3]/85 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0a0f0d]/85 lg:hidden">
      <div className="flex items-center gap-3">
        <button onClick={onProfile} aria-label="Profil" className="shrink-0 transition active:scale-90">
          <Avatar name={settings.name} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}

export function MoreSheet({ open, onClose, view, setView }) {
  const lock = useLock()
  if (!open) return null
  const items = NAV.filter((n) => !['dashboard', 'transactions', 'stats'].includes(n.id))
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="anim-fade absolute inset-0 bg-slate-950/55 backdrop-blur-md" onClick={onClose} />
      <div className="anim-pop absolute inset-x-0 bottom-0 rounded-t-[1.75rem] bg-white p-5 pb-10 shadow-2xl ring-1 ring-slate-900/5 dark:bg-[#141b18] dark:ring-white/10">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/15" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Toutes les rubriques</h2>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 transition active:scale-90 dark:bg-white/10" aria-label="Fermer">
            <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {items.map((n) => {
            const Icon = n.icon
            const active = view === n.id
            return (
              <button
                key={n.id}
                onClick={() => { setView(n.id); onClose() }}
                className={cx(
                  'flex flex-col items-center gap-2 rounded-3xl border p-4 text-xs font-bold transition active:scale-95',
                  active
                    ? 'border-brand-500/50 bg-brand-500/10 text-brand-700 shadow-lg shadow-brand-500/10 dark:text-brand-300'
                    : 'border-slate-200/70 text-slate-600 dark:border-white/10 dark:text-slate-300'
                )}
              >
                <span className={cx(
                  'flex h-11 w-11 items-center justify-center rounded-2xl',
                  active ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-500/30' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'
                )}>
                  <Icon className="h-5 w-5" />
                </span>
                {n.label}
              </button>
            )
          })}
        </div>
        {lock.enabled && (
          <button
            onClick={() => { onClose(); lock.lock() }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-extrabold text-white transition active:scale-[.98] dark:bg-white dark:text-slate-900"
          >
            <Lock className="h-4 w-4" /> Verrouiller l'application
          </button>
        )}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 hidden items-end justify-between lg:flex">
      <div>
        <h1 className="text-[1.7rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
