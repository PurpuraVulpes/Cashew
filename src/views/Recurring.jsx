import React, { useMemo, useState } from 'react'
import { Plus, Pencil, Repeat2, BellRing } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, EmptyState, Btn, IconBadge } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { RecurringModal, ConfirmModal } from '../components/Modals.jsx'
import { fullDate, todayISO, cx } from '../utils/helpers.js'

const FREQ_LABEL = { weekly: 'Hebdo', monthly: 'Mensuel', yearly: 'Annuel' }
const FREQ_FACTOR = { weekly: 4.33, monthly: 1, yearly: 1 / 12 }

export default function Recurring({ setView, onPayNow }) {
  const { recurring, categoryById, accountById, dispatch } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const monthlyCost = useMemo(() => {
    return recurring.filter((r) => r.active && r.type === 'expense').reduce((s, r) => s + (Number(r.amount) || 0) * (FREQ_FACTOR[r.frequency] || 1), 0)
  }, [recurring])

  const daysUntil = (iso) => {
    const diff = Math.round((new Date(iso) - new Date(todayISO())) / 86400000)
    return diff
  }

  const sorted = [...recurring].sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1))

  return (
    <div>
      <MobileHeader title="Abonnements" subtitle="Prélèvements récurrents" onProfile={() => setView('settings')} />
      <PageHeader
        title="Abonnements & récurrents"
        subtitle="Ne ratez plus aucune échéance"
        action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Nouvel abonnement</Btn>}
      />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        <Card className="flex items-center gap-4 bg-gradient-to-r from-sky-500 to-cyan-400 !p-5 text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20"><Repeat2 className="h-7 w-7" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Coût mensuel estimé</p>
            <p className="text-3xl font-extrabold tabular-nums"><Money value={monthlyCost} /></p>
          </div>
        </Card>

        {sorted.length === 0 ? (
          <Card>
            <EmptyState icon="phone" title="Aucun abonnement" hint="Ajoutez vos prélèvements mensuels : streaming, sport, loyer…" action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Ajouter</Btn>} />
          </Card>
        ) : (
          sorted.map((r) => {
            const cat = categoryById[r.categoryId]
            const d = daysUntil(r.nextDate)
            const overdue = d < 0
            return (
              <Card key={r.id} className={cx('p-4', !r.active && 'opacity-60')}>
                <div className="flex items-center gap-3">
                  <IconBadge icon={cat?.icon || (r.type === 'income' ? 'salary' : 'phone')} color={cat?.color || (r.type === 'income' ? '#0d9d6c' : '#64748b')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {FREQ_LABEL[r.frequency]} · {accountById[r.accountId]?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Money value={r.type === 'expense' ? -r.amount : r.amount} signed className={cx('block font-extrabold tabular-nums', r.type === 'expense' ? '' : 'text-brand-600')} />
                    <span className={cx(
                      'mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                      overdue ? 'bg-rose-500/10 text-rose-500' : d <= 7 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                    )}>
                      <BellRing className="h-3 w-3" />
                      {overdue ? `En retard (${-d} j)` : d === 0 ? "Aujourd'hui" : `J-${d}`}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-white/5">
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_RECURRING', payload: { ...r, active: !r.active } })}
                    className={cx('relative h-6 w-11 rounded-full transition', r.active ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/15')}
                    aria-label="Activer"
                  >
                    <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', r.active ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                  <button onClick={() => onPayNow(r)} className="rounded-xl bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-500/20 dark:text-brand-300">
                    Enregistrer l'échéance
                  </button>
                  <button onClick={() => { setEditing(r); setModalOpen(true) }} className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </button>
                  <button onClick={() => setDeleting(r)} className="ml-auto rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10">
                    Supprimer
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-400">Prochaine échéance : {fullDate(r.nextDate)}</p>
              </Card>
            )
          })
        )}
      </div>

      <RecurringModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer cet abonnement ?"
        message={`« ${deleting?.name} » ne sera plus suivi.`}
        onConfirm={() => dispatch({ type: 'DELETE_RECURRING', payload: deleting.id })}
      />
    </div>
  )
}
