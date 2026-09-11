import React, { useState } from 'react'
import { Plus, Pencil, ArrowLeftRight, Eye, EyeOff, Archive } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { Card, Money, EmptyState, Btn, IconBadge } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { AccountModal, ConfirmModal } from '../components/Modals.jsx'
import { ACCOUNT_TYPES } from '../data/seed.js'

export default function Accounts({ setView, onTransfer }) {
  const { accounts, balances, totalBalance, settings, dispatch } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const visible = accounts.filter((a) => showArchived ? true : !a.archived)

  return (
    <div>
      <MobileHeader title="Comptes" subtitle={`${accounts.filter((a) => !a.archived).length} comptes actifs`} onProfile={() => setView('settings')} />
      <PageHeader
        title="Comptes"
        subtitle="Comptes courants, épargne, espèces…"
        action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Nouveau compte</Btn>}
      />

      <div className="stagger space-y-4 pb-24 lg:pb-8">
        <Card className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-700 !p-5 text-white dark:from-white/10 dark:to-white/5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Patrimoine total</p>
            <p className="mt-0.5 text-3xl font-extrabold tabular-nums">
              {settings.hideBalances ? '••••••' : <Money value={totalBalance} />}
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { hideBalances: !settings.hideBalances } })}
            className="rounded-full bg-white/15 p-2.5 transition hover:bg-white/25"
            aria-label="Masquer"
          >
            {settings.hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Card>

        {visible.length === 0 ? (
          <Card>
            <EmptyState icon="bank" title="Aucun compte" hint="Créez votre premier compte pour commencer le suivi." action={<Btn onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> Créer un compte</Btn>} />
          </Card>
        ) : (
          visible.map((a) => {
            const bal = balances[a.id] ?? 0
            const typeLabel = ACCOUNT_TYPES.find((t) => t.id === a.type)?.label || a.type
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-center gap-3">
                  <IconBadge icon={a.icon} color={a.color} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-extrabold text-slate-900 dark:text-white">
                      {a.name}
                      {a.archived && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/15">archivé</span>}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{typeLabel}</p>
                  </div>
                  <Money value={bal} className="text-lg font-extrabold text-slate-900 dark:text-white" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-white/5">
                  <button onClick={() => onTransfer(a.id)} className="flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-500/20 dark:text-brand-300">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Virement
                  </button>
                  <button onClick={() => { setEditing(a); setModalOpen(true) }} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </button>
                  <button onClick={() => dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...a, archived: !a.archived } })} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">
                    <Archive className="h-3.5 w-3.5" /> {a.archived ? 'Désarchiver' : 'Archiver'}
                  </button>
                  <button onClick={() => setDeleting(a)} className="ml-auto rounded-xl px-3 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-500/10">
                    Supprimer
                  </button>
                </div>
              </Card>
            )
          })
        )}

        {accounts.some((a) => a.archived) && (
          <button onClick={() => setShowArchived(!showArchived)} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600">
            {showArchived ? 'Masquer les comptes archivés' : 'Afficher les comptes archivés'}
          </button>
        )}
      </div>

      <AccountModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Supprimer ce compte ?"
        message={`« ${deleting?.name} » et toutes ses opérations seront définitivement supprimés.`}
        onConfirm={() => dispatch({ type: 'DELETE_ACCOUNT', payload: deleting.id })}
      />
    </div>
  )
}
