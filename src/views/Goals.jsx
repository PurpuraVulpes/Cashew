import React, { useState } from 'react'
import { Plus, Pencil, HandCoins, CalendarDays } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, ProgressBar, EmptyState, Btn, IconBadge } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { GoalModal, GoalFundModal, ConfirmModal } from '../components/Modals.jsx'
import { fullDate } from '../utils/helpers.js'

export default function Goals({ setView }) {
  const { goals, dispatch } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [funding, setFunding] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const totalSaved = goals.reduce((s, g) => s + (Number(g.saved) || 0), 0)
  const totalTarget = goals.reduce((s, g) => s + (Number(g.target) || 0), 0)

  return (
    <div>
      <MobileHeader title="Objectifs" subtitle={`${goals.length} projet${goals.length > 1 ? 's' : ''} en cours`} onProfile={() => setView('settings')} />
      <PageHeader
        title="Objectifs d'épargne"
        subtitle="Visualisez vos projets et suivez leur financement"
        action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Nouvel objectif</Btn>}
      />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        {goals.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-400 to-orange-500 !p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Épargne totale des objectifs</p>
            <p className="mt-0.5 text-3xl font-extrabold tabular-nums"><Money value={totalSaved} /> <span className="text-lg font-bold text-white/70">/ <Money value={totalTarget} compact /></span></p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0}%` }} />
            </div>
          </Card>
        )}

        {goals.length === 0 ? (
          <Card>
            <EmptyState icon="piggy" title="Aucun objectif" hint="Voyage, apport immobilier, nouvel ordinateur… donnez un sens à votre épargne." action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Créer un objectif</Btn>} />
          </Card>
        ) : (
          goals.map((g) => {
            const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0
            const done = g.saved >= g.target
            return (
              <Card key={g.id} className="p-5">
                <div className="flex items-center gap-3">
                  <IconBadge icon={g.icon} color={g.color} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-slate-900 dark:text-white">
                      {done ? '🎉 ' : ''}{g.name}
                    </p>
                    {g.deadline && (
                      <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-3 w-3" /> Avant le {fullDate(g.deadline)}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full px-3 py-1.5 text-sm font-extrabold tabular-nums" style={{ backgroundColor: g.color + '1f', color: g.color }}>
                    {Math.round(pct)} %
                  </span>
                </div>
                <div className="mt-3"><ProgressBar value={g.saved} max={g.target} color={g.color} /></div>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="font-extrabold tabular-nums text-slate-900 dark:text-white"><Money value={g.saved} /></span>
                  <span className="font-semibold text-slate-400">objectif <Money value={g.target} /></span>
                </div>
                {!done && (
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Plus que <Money value={g.target - g.saved} className="font-extrabold text-slate-700 dark:text-slate-200" /> à épargner 💪
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-white/5">
                  <button onClick={() => setFunding(g)} className="flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-500/20 dark:text-brand-300">
                    <HandCoins className="h-3.5 w-3.5" /> Alimenter
                  </button>
                  <button onClick={() => { setEditing(g); setModalOpen(true) }} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </button>
                  <button onClick={() => setDeleting(g)} className="ml-auto rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10">
                    Supprimer
                  </button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <GoalModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      <GoalFundModal open={!!funding} onClose={() => setFunding(null)} goal={funding} />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer cet objectif ?"
        message={`« ${deleting?.name} » sera définitivement supprimé.`}
        onConfirm={() => dispatch({ type: 'DELETE_GOAL', payload: deleting.id })}
      />
    </div>
  )
}
