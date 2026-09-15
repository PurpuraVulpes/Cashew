import React, { useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Download, SlidersHorizontal, Pencil, Trash2, X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, EmptyState, Btn, Money, Segmented, inputCls } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { TxRow } from './Dashboard.jsx'
import {
  currentMonthKey, shiftMonthKey, monthKeyLabel, monthKeyOf,
  dayLabel, transactionsToCSV, downloadFile, fullDate, cx,
} from '../utils/helpers.js'

const TYPE_OPTS = [
  { value: 'all', label: 'Tout' },
  { value: 'expense', label: 'Dépenses' },
  { value: 'income', label: 'Revenus' },
  { value: 'transfer', label: 'Virements' },
]

export default function Transactions({ onAdd, onEditTx, onDeleteTx, onDuplicate }) {
  const { transactions, accounts, categories, accountById, categoryById } = useFinance()
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const [accountId, setAccountId] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => monthKeyOf(t.date) === monthKey)
      .filter((t) => type === 'all' || t.type === type)
      .filter((t) => accountId === 'all' || t.accountId === accountId || t.toAccountId === accountId)
      .filter((t) => categoryId === 'all' || t.categoryId === categoryId)
      .filter((t) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        const cat = categoryById[t.categoryId]?.name || ''
        return (t.note || '').toLowerCase().includes(q) || cat.toLowerCase().includes(q)
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }, [transactions, monthKey, type, accountId, categoryId, query, categoryById])

  const groups = useMemo(() => {
    const g = {}
    for (const t of filtered) {
      const d = t.date.slice(0, 10)
      if (!g[d]) g[d] = { date: d, items: [], total: 0 }
      g[d].items.push(t)
      if (t.type === 'income') g[d].total += Number(t.amount) || 0
      else if (t.type === 'expense') g[d].total -= Number(t.amount) || 0
    }
    return Object.values(g).sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [filtered])

  const totals = useMemo(() => {
    let income = 0, expense = 0
    for (const t of filtered) {
      if (t.type === 'income') income += Number(t.amount) || 0
      else if (t.type === 'expense') expense += Number(t.amount) || 0
    }
    return { income, expense }
  }, [filtered])

  const exportCSV = () => {
    const rows = filtered.map((t) => ({
      date: t.date.slice(0, 10),
      type: t.type === 'expense' ? 'Dépense' : t.type === 'income' ? 'Revenu' : 'Virement',
      amount: t.amount,
      account: accountById[t.accountId]?.name || '',
      toAccount: t.toAccountId ? accountById[t.toAccountId]?.name || '' : '',
      category: categoryById[t.categoryId]?.name || '',
      note: t.note || '',
    }))
    downloadFile(`cashew-${monthKey}.csv`, transactionsToCSV(rows), 'text/csv;charset=utf-8')
  }

  const hasFilters = accountId !== 'all' || categoryId !== 'all' || query.trim() !== ''

  return (
    <div>
      <MobileHeader
        title="Transactions"
        subtitle={`${filtered.length} opération${filtered.length > 1 ? 's' : ''} · ${monthKeyLabel(monthKey)}`}
        onProfile={() => {}}
        right={
          <button onClick={exportCSV} className="rounded-full bg-slate-100 p-2.5 dark:bg-white/10" aria-label="Exporter CSV">
            <Download className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
          </button>
        }
      />
      <PageHeader
        title="Transactions"
        subtitle="Recherchez, filtrez et gérez toutes vos opérations"
        action={<Btn variant="secondary" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Btn>}
      />

      <div className="space-y-4 pb-24 lg:pb-8">
        {/* Sélecteur mois */}
        <Card className="flex items-center justify-between p-2">
          <button onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))} className="rounded-xl p-2.5 transition hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Mois précédent">
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="text-center">
            <button onClick={() => setMonthKey(currentMonthKey())} className="text-[15px] font-extrabold capitalize text-slate-900 dark:text-white">
              {monthKeyLabel(monthKey)}
            </button>
            {monthKey !== currentMonthKey() && (
              <button onClick={() => setMonthKey(currentMonthKey())} className="block w-full text-[11px] font-bold text-brand-600">Revenir à aujourd'hui</button>
            )}
          </div>
          <button onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))} className="rounded-xl p-2.5 transition hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Mois suivant">
            <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        </Card>

        {/* Totaux */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="p-3.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Revenus</p>
            <Money value={totals.income} compact className="text-base font-extrabold text-brand-600 dark:text-brand-400" />
          </Card>
          <Card className="p-3.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Dépenses</p>
            <Money value={totals.expense} compact className="text-base font-extrabold text-rose-500" />
          </Card>
          <Card className="p-3.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Net</p>
            <Money value={totals.income - totals.expense} compact signed className="text-base font-extrabold" />
          </Card>
        </div>

        <Segmented options={TYPE_OPTS} value={type} onChange={setType} />

        {/* Recherche */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une opération…"
              className={cx(inputCls, '!pl-11 !pr-10')}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 p-1 dark:bg-white/15" aria-label="Effacer">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx('rounded-2xl border px-4 transition', showFilters || hasFilters ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400')}
            aria-label="Filtres"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {showFilters && (
          <Card className="anim-pop grid grid-cols-2 gap-3 p-4">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Compte</p>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
                <option value="all">Tous les comptes</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Catégorie</p>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                <option value="all">Toutes catégories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </Card>
        )}

        {/* Liste groupée */}
        {groups.length === 0 ? (
          <Card>
            <EmptyState
              icon="wallet"
              title="Aucune opération"
              hint={hasFilters ? 'Essayez d’ajuster vos filtres.' : 'Ajoutez votre première opération de ce mois.'}
              action={!hasFilters && <Btn onClick={() => onAdd()}>＋ Ajouter une opération</Btn>}
            />
          </Card>
        ) : (
          groups.map((g) => (
            <div key={g.date}>
              <div className="mb-1.5 flex items-center justify-between px-1">
                <p className="text-[13px] font-extrabold capitalize text-slate-500 dark:text-slate-400">{dayLabel(g.date)}</p>
                {g.total !== 0 && (
                  <Money value={g.total} signed compact className="text-xs font-extrabold" />
                )}
              </div>
              <Card className="divide-y divide-slate-100 px-3 dark:divide-white/5">
                {g.items.map((t) => <TxRow key={t.id} tx={t} onClick={() => setSelected(t)} />)}
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Panneau détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="anim-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="anim-pop relative w-full rounded-t-3xl bg-white p-6 pb-8 dark:bg-[#141b18] sm:max-w-sm sm:rounded-3xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 dark:bg-white/15 sm:hidden" />
            <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-400">{fullDate(selected.date)}</p>
            <p className="mt-1 text-center text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              <Money value={selected.type === 'expense' ? -selected.amount : selected.amount} signed={selected.type !== 'transfer'} />
            </p>
            <p className="mt-1 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              {selected.type === 'transfer'
                ? `${accountById[selected.accountId]?.name} → ${accountById[selected.toAccountId]?.name}`
                : `${categoryById[selected.categoryId]?.name || 'Sans catégorie'} · ${accountById[selected.accountId]?.name}`}
            </p>
            {selected.note && <p className="mx-auto mt-3 max-w-xs rounded-2xl bg-slate-100 px-4 py-2.5 text-center text-sm font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">« {selected.note} »</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Btn variant="secondary" onClick={() => { onEditTx(selected); setSelected(null) }}><Pencil className="h-4 w-4" /> Modifier</Btn>
              <Btn variant="soft" onClick={() => { onDuplicate?.(selected); setSelected(null) }}>⧉ Dupliquer</Btn>
              <Btn variant="danger" className="col-span-2" onClick={() => { onDeleteTx(selected.id); setSelected(null) }}><Trash2 className="h-4 w-4" /> Supprimer</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
