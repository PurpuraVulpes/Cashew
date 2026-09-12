import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinance } from './context/FinanceContext.jsx'
import { useLock } from './context/LockContext.jsx'
import { Sidebar, BottomNav, MoreSheet } from './components/Layout.jsx'
import TransactionModal from './components/TransactionModal.jsx'
import { LockScreen } from './components/Lock.jsx'
import { ConfirmModal } from './components/Modals.jsx'
import Dashboard from './views/Dashboard.jsx'
import Transactions from './views/Transactions.jsx'
import Stats from './views/Stats.jsx'
import Budgets from './views/Budgets.jsx'
import Work from './views/Work.jsx'
import Accounts from './views/Accounts.jsx'
import Goals from './views/Goals.jsx'
import Recurring from './views/Recurring.jsx'
import Categories from './views/Categories.jsx'
import Settings from './views/Settings.jsx'
import { todayISO, toISODate } from './utils/helpers.js'

export default function App() {
  const { dispatch } = useFinance()
  const { locked } = useLock()
  const [view, setView] = useState('dashboard')
  const [txOpen, setTxOpen] = useState(false)
  const [txPreset, setTxPreset] = useState({})
  const [txEditing, setTxEditing] = useState(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [deletingTx, setDeletingTx] = useState(null)

  const openAdd = (type = 'expense', extra = {}) => {
    setTxEditing(null)
    setTxPreset({ type, ...extra })
    setTxOpen(true)
  }

  const openEditTx = (tx) => {
    setTxEditing(tx)
    setTxPreset({})
    setTxOpen(true)
  }

  const openTransfer = (fromAccountId) => {
    openAdd('transfer', { accountId: fromAccountId })
  }

  // Enregistrer une échéance d'abonnement = créer la transaction + repousser nextDate
  const payRecurring = (r) => {
    dispatch({
      type: 'ADD_TX',
      payload: {
        type: r.type, amount: r.amount, accountId: r.accountId,
        toAccountId: null, categoryId: r.categoryId, date: todayISO(), note: r.name,
      },
    })
    const next = new Date(r.nextDate)
    if (r.frequency === 'weekly') next.setDate(next.getDate() + 7)
    else if (r.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1)
    else next.setMonth(next.getMonth() + 1)
    dispatch({ type: 'UPDATE_RECURRING', payload: { ...r, nextDate: toISODate(next) } })
  }

  return (
    <div className="app-bg min-h-full text-slate-900 dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-[1200px] lg:gap-6 lg:px-6">
        <Sidebar view={view} setView={setView} onAdd={() => openAdd()} />

        <main className="min-w-0 flex-1 px-4 pb-8 pt-0 lg:py-6">
          <div key={view} className="anim-view">
            {view === 'dashboard' && <Dashboard setView={setView} onAdd={openAdd} onEditTx={openEditTx} />}
            {view === 'transactions' && <Transactions onAdd={openAdd} onEditTx={openEditTx} onDeleteTx={setDeletingTx} onDuplicate={(tx) => openAdd(tx.type, { amount: tx.amount, accountId: tx.accountId, categoryId: tx.categoryId, date: tx.date?.slice(0, 10), note: tx.note })} />}
            {view === 'stats' && <Stats setView={setView} />}
            {view === 'budgets' && <Budgets setView={setView} />}
            {view === 'work' && <Work setView={setView} />}
            {view === 'accounts' && <Accounts setView={setView} onTransfer={openTransfer} />}
            {view === 'goals' && <Goals setView={setView} />}
            {view === 'recurring' && <Recurring setView={setView} onPayNow={payRecurring} />}
            {view === 'categories' && <Categories setView={setView} />}
            {view === 'settings' && <Settings setView={setView} />}
          </div>
        </main>
      </div>

      {/* Bouton flottant desktop */}
      <button
        onClick={() => openAdd()}
        aria-label="Ajouter une opération"
        className="fixed bottom-8 right-8 hidden items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-2xl shadow-brand-500/40 ring-4 ring-white/50 transition hover:scale-110 active:scale-95 dark:ring-white/10 lg:flex"
        style={{ width: 60, height: 60 }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <BottomNav view={view} setView={setView} onAdd={() => openAdd()} onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} view={view} setView={setView} />

      <TransactionModal open={txOpen} onClose={() => setTxOpen(false)} editing={txEditing} preset={txPreset} />
      <ConfirmModal
        open={!!deletingTx}
        onClose={() => setDeletingTx(null)}
        title="Supprimer cette opération ?"
        message="Cette opération sera définitivement supprimée et les soldes recalculés."
        onConfirm={() => dispatch({ type: 'DELETE_TX', payload: deletingTx })}
      />

      {locked && <LockScreen />}
    </div>
  )
}
