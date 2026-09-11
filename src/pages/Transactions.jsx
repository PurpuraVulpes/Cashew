import { useMemo, useState } from 'react'
import { Search, X, Inbox, Repeat } from 'lucide-react'
import { useStore } from '../store.jsx'
import { useUI } from '../ui.jsx'
import TxRow from '../components/TxRow.jsx'
import { categoryById } from '../data.js'
import { groupByDay, fmtMoney, fmtSigned, inMonth } from '../utils.js'

export default function Transactions() {
  const { state } = useStore()
  const { open } = useUI()
  const currency = state.settings.currency
  const [query, setQuery] = useState('')
  const [accountFilter, setAccountFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [recOnly, setRecOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.transactions.filter((t) => {
      if (accountFilter !== 'all' && t.accountId !== accountFilter) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (recOnly && !t.recurring) return false
      if (!q) return true
      const cat = categoryById(t.categoryId)
      return (
        t.name.toLowerCase().includes(q) ||
        cat.label.toLowerCase().includes(q) ||
        (accountName(t.accountId) || '').toLowerCase().includes(q)
      )
    })

    function accountName(id) {
      return state.accounts.find((a) => a.id === id)?.name
    }
  }, [state.transactions, state.accounts, query, accountFilter, typeFilter, recOnly])

  const groups = useMemo(() => groupByDay(filtered), [filtered])

  const now = new Date()
  const monthTxns = state.transactions.filter((t) => inMonth(t.date, now))
  const monthIn = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthOut = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const dayNet = (txns) => txns.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)

  return (
    <>
      <header className="page-header">
        <h1 className="header-title">Transactions</h1>
      </header>

      <div className="card" style={{ padding: '12px 14px', marginBottom: 14 }}>
        <div className="summary-line">
          <span className="lbl">Revenus du mois</span>
          <span className="val" style={{ color: 'var(--up)' }}>
            +{fmtMoney(monthIn, currency)}
          </span>
        </div>
        <div className="summary-line">
          <span className="lbl">Dépenses du mois</span>
          <span className="val" style={{ color: 'var(--down)' }}>
            −{fmtMoney(monthOut, currency)}
          </span>
        </div>
      </div>

      <div className="search-box">
        <Search size={18} color="var(--text-dim)" />
        <input
          placeholder="Rechercher…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Effacer">
            <X size={17} color="var(--text-dim)" />
          </button>
        )}
      </div>

      <div className="chips-row">
        <button
          className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          Toutes
        </button>
        <button
          className={`filter-chip ${typeFilter === 'expense' ? 'active' : ''}`}
          onClick={() => setTypeFilter('expense')}
        >
          Dépenses
        </button>
        <button
          className={`filter-chip ${typeFilter === 'income' ? 'active' : ''}`}
          onClick={() => setTypeFilter('income')}
        >
          Revenus
        </button>
        <button
          className={`filter-chip ${recOnly ? 'active' : ''}`}
          onClick={() => setRecOnly((v) => !v)}
        >
          <Repeat size={13} />
          Abonnements
        </button>
        {state.accounts.map((a) => (
          <button
            key={a.id}
            className={`filter-chip ${accountFilter === a.id ? 'active' : ''}`}
            onClick={() => setAccountFilter(accountFilter === a.id ? 'all' : a.id)}
          >
            <span className="dot" style={{ background: a.color }} />
            {a.name}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="empty">
          <Inbox size={44} style={{ marginBottom: 10 }} color="var(--text-faint)" />
          <h3>Rien à afficher</h3>
          <p>Aucune transaction ne correspond à votre recherche.</p>
        </div>
      ) : (
        groups.map(([date, txns]) => (
          <section key={date}>
            <div className="day-group-label">
              <span style={{ textTransform: 'capitalize' }}>
                {date === undefined ? '' : formatDay(date)}
              </span>
              <span
                className="day-net"
                style={{ color: dayNet(txns) >= 0 ? 'var(--up)' : 'var(--down)' }}
              >
                {fmtSigned(Math.abs(dayNet(txns)), currency, dayNet(txns) >= 0 ? 'income' : 'expense')}
              </span>
            </div>
            <div className="card list-card" style={{ marginTop: 0 }}>
              {txns.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  currency={currency}
                  showAccount={accountFilter === 'all'}
                  account={state.accounts.find((a) => a.id === tx.accountId)}
                  onClick={(t) => open('transaction', { tx: t })}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  )
}

function formatDay(iso) {
  const today = new Date()
  const d = new Date(iso + 'T12:00:00')
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const same = (x) => x.toDateString() === d.toDateString()
  if (same(today)) return "Aujourd'hui"
  if (same(yesterday)) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
