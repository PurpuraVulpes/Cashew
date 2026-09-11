import React, { useMemo, useState } from 'react'
import { Plus, Pencil, PartyPopper, CircleAlert, CircleCheck } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, ProgressBar, EmptyState, Btn, IconBadge } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { BudgetModal, ConfirmModal } from '../components/Modals.jsx'
import { currentMonthKey, monthKeyOf } from '../utils/helpers.js'

export default function Budgets({ setView }) {
  const { budgets, transactions, categoryById, monthStats, dispatch } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const monthKey = currentMonthKey()
  const stats = monthStats(monthKey)

  const spentByCat = useMemo(() => {
    const m = {}
    for (const t of transactions.filter((t) => monthKeyOf(t.date) === monthKey && t.type === 'expense')) {
      m[t.categoryId] = (m[t.categoryId] || 0) + (Number(t.amount) || 0)
    }
    return m
  }, [transactions, monthKey])

  const rows = useMemo(() => {
    return budgets.map((b) => {
      const spent = b.categoryId === 'all' ? stats.expense : spentByCat[b.categoryId] || 0
      const remaining = b.amount - spent
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
      const status = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok'
      return { ...b, spent, remaining, pct, status }
    }).sort((a, b) => (a.categoryId === 'all' ? -1 : b.categoryId === 'all' ? 1 : b.pct - a.pct))
  }, [budgets, stats.expense, spentByCat])

  const global = rows.find((r) => r.categoryId === 'all')
  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
  const dailyAllowed = global && daysLeft > 0 ? Math.max(0, global.remaining / daysLeft) : 0

  return (
    <div>
      <MobileHeader title="Budgets" subtitle="Vos limites mensuelles" onProfile={() => setView('settings')} />
      <PageHeader
        title="Budgets"
        subtitle="Fixez des limites mensuelles et suivez-les en temps réel"
        action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Nouveau budget</Btn>}
      />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        {global && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 p-6 text-white shadow-xl shadow-violet-500/25">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <p className="text-sm font-semibold text-white/80">Budget global · reste à dépenser</p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums"><Money value={Math.max(0, global.remaining)} /></p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, global.pct)}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold text-white/90">
              <span><Money value={global.spent} compact /> dépensés</span>
              <span><Money value={global.amount} compact /> prévus</span>
            </div>
            <p className="mt-3 rounded-2xl bg-slate-950/20 px-4 py-2.5 text-sm backdrop-blur">
              💡 Vous pouvez encore dépenser <strong><Money value={dailyAllowed} /></strong> / jour pendant {daysLeft} jours.
            </p>
          </div>
        )}

        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon="money"
              title="Aucun budget pour le moment"
              hint="Créez un budget global ou par catégorie pour maîtriser vos dépenses."
              action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Créer un budget</Btn>}
            />
          </Card>
        ) : (
          rows.filter((r) => r.categoryId !== 'all').map((r) => {
            const cat = categoryById[r.categoryId]
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-center gap-3">
                  <IconBadge icon={cat?.icon || 'dots'} color={cat?.color || '#64748b'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-slate-900 dark:text-white">{cat?.name || 'Catégorie supprimée'}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Money value={r.spent} /> sur <Money value={r.amount} />
                    </p>
                  </div>
                  {r.status === 'over' ? (
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-extrabold text-rose-500"><CircleAlert className="h-3.5 w-3.5" /> Dépassé</span>
                  ) : r.status === 'warn' ? (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">⚠ {Math.round(r.pct)} %</span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1.5 text-xs font-extrabold text-brand-600 dark:text-brand-400"><CircleCheck className="h-3.5 w-3.5" /> {Math.round(r.pct)} %</span>
                  )}
                </div>
                <div className="mt-3"><ProgressBar value={r.spent} max={r.amount} color={cat?.color || '#0d9d6c'} /></div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {r.remaining >= 0 ? <>Reste <Money value={r.remaining} className="text-slate-700 dark:text-slate-200" /></> : <><Money value={-r.remaining} className="text-rose-500" /> de dépassement</>}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(r); setModalOpen(true) }} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </button>
                    <button onClick={() => setDeleting(r)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-rose-500 transition hover:bg-rose-500/10">
                      Supprimer
                    </button>
                  </div>
                </div>
              </Card>
            )
          })
        )}

        {rows.length > 0 && rows.every((r) => r.status === 'ok') && (
          <Card className="flex items-center gap-3 border-brand-500/30 bg-brand-500/5 p-5">
            <PartyPopper className="h-8 w-8 text-brand-500" />
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white">Excellent mois ! 🎉</p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tous vos budgets sont sous contrôle. Continuez comme ça.</p>
            </div>
          </Card>
        )}

        <Btn variant="secondary" className="w-full lg:hidden" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4" /> Nouveau budget
        </Btn>
      </div>

      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer ce budget ?"
        message="Le suivi de cette catégorie ne sera plus limité. Vos transactions sont conservées."
        onConfirm={() => dispatch({ type: 'DELETE_BUDGET', payload: deleting.id })}
      />
    </div>
  )
}
