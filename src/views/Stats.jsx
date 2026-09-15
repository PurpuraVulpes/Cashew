import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Trophy } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, EmptyState, Segmented, IconBadge } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import {
  currentMonthKey, shiftMonthKey, monthKeyLabel, monthKeyOf, formatMoney,
} from '../utils/helpers.js'

export default function Stats({ setView }) {
  const { transactions, categoryById, settings, monthStats, brand500 } = useFinance()
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [scope, setScope] = useState('month') // month | 6months

  const stats = monthStats(monthKey)

  // 6 derniers mois
  const monthly = useMemo(() => {
    const arr = []
    for (let i = 5; i >= 0; i--) {
      const key = shiftMonthKey(currentMonthKey(), -i)
      const s = monthStats(key)
      const [, m] = key.split('-').map(Number)
      const short = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][m - 1]
      arr.push({ key, label: short, revenus: Math.round(s.income), depenses: Math.round(s.expense) })
    }
    return arr
  }, [transactions]) // eslint-disable-line

  const byCategory = useMemo(() => {
    const map = {}
    const list = scope === 'month'
      ? transactions.filter((t) => monthKeyOf(t.date) === monthKey && t.type === 'expense')
      : transactions.filter((t) => t.type === 'expense' && monthly.some((m) => monthKeyOf(t.date) === m.key))
    for (const t of list) {
      const id = t.categoryId || 'none'
      map[id] = (map[id] || 0) + (Number(t.amount) || 0)
    }
    const total = Object.values(map).reduce((s, v) => s + v, 0)
    return Object.entries(map)
      .map(([id, value]) => ({
        id,
        name: categoryById[id]?.name || 'Autre',
        icon: categoryById[id]?.icon || 'dots',
        color: categoryById[id]?.color || '#64748b',
        value: Math.round(value * 100) / 100,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, monthKey, scope, categoryById, monthly])

  const totalCat = byCategory.reduce((s, c) => s + c.value, 0)

  const biggest = useMemo(() => {
    const list = scope === 'month'
      ? transactions.filter((t) => monthKeyOf(t.date) === monthKey && t.type === 'expense')
      : transactions.filter((t) => t.type === 'expense')
    return [...list].sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [transactions, monthKey, scope])

  const avgPerDay = scope === 'month' ? stats.expense / 30 : totalCat / 180
  const topCat = byCategory[0]

  const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.12)', fontSize: 12, fontWeight: 700 }

  return (
    <div>
      <MobileHeader
        title="Statistiques"
        subtitle={scope === 'month' ? monthKeyLabel(monthKey) : '6 derniers mois'}
        onProfile={() => setView('settings')}
      />
      <PageHeader title="Statistiques" subtitle="Comprenez vos habitudes de dépenses" />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        <Segmented
          options={[{ value: 'month', label: 'Ce mois' }, { value: '6months', label: '6 derniers mois' }]}
          value={scope} onChange={setScope}
        />

        {scope === 'month' && (
          <Card className="flex items-center justify-between p-2">
            <button onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))} className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Précédent">
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button onClick={() => setMonthKey(currentMonthKey())} className="text-[15px] font-extrabold capitalize text-slate-900 dark:text-white">
              {monthKeyLabel(monthKey)}
            </button>
            <button onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))} className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Suivant">
              <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><TrendingDown className="h-4 w-4 text-brand-500" /> Revenus</p>
            <Money value={scope === 'month' ? stats.income : monthly.reduce((s, m) => s + m.revenus, 0)} compact className="mt-1 block text-xl font-extrabold text-slate-900 dark:text-white" />
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><TrendingUp className="h-4 w-4 text-rose-500" /> Dépenses</p>
            <Money value={scope === 'month' ? stats.expense : monthly.reduce((s, m) => s + m.depenses, 0)} compact className="mt-1 block text-xl font-extrabold text-slate-900 dark:text-white" />
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><Wallet className="h-4 w-4 text-sky-500" /> Moy. / jour</p>
            <Money value={avgPerDay} className="mt-1 block text-xl font-extrabold text-slate-900 dark:text-white" />
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><Trophy className="h-4 w-4 text-amber-500" /> Top catégorie</p>
            <p className="mt-1 truncate text-xl font-extrabold text-slate-900 dark:text-white">{topCat?.name || '—'}</p>
          </Card>
        </div>

        {/* Évolution */}
        <Card className="p-5">
          <h3 className="font-extrabold text-slate-900 dark:text-white">Évolution mensuelle</h3>
          <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">Revenus vs dépenses sur 6 mois</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} barGap={4} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" opacity={0.5} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 100) / 10}k` : v} />
                <Tooltip formatter={(v, name) => [formatMoney(v, settings.currency, { compact: true }), name === 'depenses' ? 'Dépenses' : 'Revenus']} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(148,163,184,.12)' }} />
                <Bar dataKey="revenus" fill={brand500} radius={[6, 6, 2, 2]} maxBarSize={26} />
                <Bar dataKey="depenses" fill="#f43f5e" radius={[6, 6, 2, 2]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Répartition */}
        <Card className="p-5">
          <h3 className="font-extrabold text-slate-900 dark:text-white">Répartition des dépenses</h3>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {scope === 'month' ? 'Ce mois-ci' : 'Sur 6 mois'} · Total <Money value={totalCat} className="font-extrabold text-slate-700 dark:text-slate-200" />
          </p>
          {byCategory.length === 0 ? (
            <EmptyState icon="chart" title="Aucune dépense" hint="Aucune dépense sur cette période." />
          ) : (
            <>
              <div className="mx-auto h-52 max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                      {byCategory.map((c) => <Cell key={c.id} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, _n, p) => [`${formatMoney(v, settings.currency)} (${p.payload.pct} %)`, p.payload.name]} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {byCategory.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-white/5">
                    <IconBadge icon={c.icon} color={c.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                        <span className="font-extrabold tabular-nums text-slate-900 dark:text-white"><Money value={c.value} /> <span className="text-xs font-bold text-slate-400">· {c.pct}%</span></span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Plus grosses dépenses */}
        <Card className="p-5">
          <h3 className="mb-3 font-extrabold text-slate-900 dark:text-white">Plus grosses dépenses</h3>
          {biggest.length === 0 ? (
            <EmptyState icon="dots" title="Rien à afficher" />
          ) : (
            <div className="space-y-2">
              {biggest.map((t, i) => {
                const cat = categoryById[t.categoryId]
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">#{i + 1}</span>
                    <IconBadge icon={cat?.icon || 'dots'} color={cat?.color || '#64748b'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{t.note || cat?.name || 'Dépense'}</p>
                      <p className="text-xs font-medium text-slate-400">{cat?.name || ''}</p>
                    </div>
                    <Money value={t.amount} className="text-sm font-extrabold text-rose-500" />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Solde cumulé */}
        <Card className="p-5">
          <h3 className="font-extrabold text-slate-900 dark:text-white">Solde net mensuel</h3>
          <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">Revenus moins dépenses, mois par mois</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly.map((m) => ({ ...m, net: m.revenus - m.depenses }))} margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip formatter={(v) => [formatMoney(v, settings.currency), 'Net']} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#gNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
