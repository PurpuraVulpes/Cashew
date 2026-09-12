import React, { useMemo, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, EmptyState, Btn, Segmented, IconBadge } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { CategoryModal, ConfirmModal } from '../components/Modals.jsx'
import { currentMonthKey, monthKeyOf } from '../utils/helpers.js'

export default function Categories({ setView }) {
  const { categories, transactions, dispatch } = useFinance()
  const [tab, setTab] = useState('expense')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const totals = useMemo(() => {
    const m = {}
    for (const t of transactions.filter((t) => monthKeyOf(t.date) === currentMonthKey() && t.type !== 'transfer')) {
      m[t.categoryId] = (m[t.categoryId] || 0) + (Number(t.amount) || 0)
    }
    return m
  }, [transactions])

  const counts = useMemo(() => {
    const m = {}
    for (const t of transactions) m[t.categoryId] = (m[t.categoryId] || 0) + 1
    return m
  }, [transactions])

  const list = categories.filter((c) => c.type === tab)

  return (
    <div>
      <MobileHeader title="Catégories" subtitle="Organisez vos opérations" onProfile={() => setView('settings')} />
      <PageHeader
        title="Catégories"
        subtitle="Personnalisez vos catégories de dépenses et revenus"
        action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Nouvelle catégorie</Btn>}
      />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        <Segmented options={[{ value: 'expense', label: 'Dépenses' }, { value: 'income', label: 'Revenus' }]} value={tab} onChange={setTab} />

        {list.length === 0 ? (
          <Card>
            <EmptyState icon="shop" title="Aucune catégorie" hint="Créez votre première catégorie pour classer vos opérations." action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Créer</Btn>} />
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100 p-2 dark:divide-white/5">
            {list.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                <IconBadge icon={c.icon} color={c.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-xs font-medium text-slate-400">
                    {counts[c.id] || 0} opération{(counts[c.id] || 0) > 1 ? 's' : ''} · <Money value={totals[c.id] || 0} compact /> ce mois
                  </p>
                </div>
                <button onClick={() => { setEditing(c); setModalOpen(true) }} className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button onClick={() => setDeleting(c)} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10">
                  Supprimer
                </button>
              </div>
            ))}
          </Card>
        )}
      </div>

      <CategoryModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} defaultType={tab} />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer cette catégorie ?"
        message="Les opérations liées seront conservées mais déclassées (« Sans catégorie »)."
        onConfirm={() => dispatch({ type: 'DELETE_CATEGORY', payload: deleting.id })}
      />
    </div>
  )
}
