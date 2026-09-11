import { useMemo, useState } from 'react'
import { Plus, History, EllipsisVertical } from 'lucide-react'
import { useStore } from '../store.jsx'
import { useUI } from '../ui.jsx'
import { LineChart } from '../components/Charts.jsx'
import TxRow from '../components/TxRow.jsx'
import {
  accountBalance,
  totalBalance,
  cumulativeSeries,
  groupByDay,
  budgetWindow,
  periodSpent,
  fmtMoney,
  daysBetween,
  clamp,
  formatShortDay,
  weekdayLabel,
  todayISO,
} from '../utils.js'

const RANGES = [
  { days: 7, label: '7 j' },
  { days: 30, label: '30 j' },
  { days: 90, label: '90 j' },
]

function BudgetBanner({ budget }) {
  const { state } = useStore()
  const { open } = useUI()
  const currency = state.settings.currency
  const win = budgetWindow(budget)
  const spent = periodSpent(state.transactions, win.start, win.end, budget.categoryIds)
  const left = budget.amount - spent
  const pct = clamp((spent / budget.amount) * 100, 0, 100)
  const over = spent > budget.amount
  const totalDays = Math.max(daysBetween(win.start, win.end), 1)
  const elapsed = clamp(daysBetween(win.start, todayISO()) / totalDays, 0, 1)
  const remainingDays = Math.max(daysBetween(todayISO(), win.end), 0)
  const perDay = remainingDays > 0 ? Math.max(left, 0) / (remainingDays + 1) : 0

  return (
    <button className="budget-banner" onClick={() => open('budget', { budget })}>
      <div className="budget-banner-top">
        <div className="budget-banner-title">{budget.name}</div>
        <div className="budget-banner-amount">
          {over ? (
            <>
              Dépassé de {fmtMoney(Math.abs(left), currency)}
            </>
          ) : (
            <>
              {fmtMoney(left, currency)} <span className="muted">restants sur {fmtMoney(budget.amount, currency)}</span>
            </>
          )}
        </div>
        <span className="budget-banner-clock">
          <History size={22} />
        </span>
      </div>
      <div className="budget-banner-body">
        <div className="budget-dates">
          <span>{formatShortDay(win.start)}</span>
          <span>{formatShortDay(win.end)}</span>
        </div>
        <div className="budget-track">
          <div className={`budget-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
          <div className="budget-marker" style={{ left: `${elapsed * 100}%` }}>
            <span className="budget-marker-label">Aujourd'hui</span>
          </div>
        </div>
        <div className="budget-pct" style={{ color: over ? 'var(--down)' : 'var(--text)' }}>
          {Math.round((spent / budget.amount) * 100)}%
        </div>
        <div className="budget-hint">
          {over ? (
            <>Budget dépassé, courage ! 💪</>
          ) : remainingDays > 0 ? (
            <>
              Vous pouvez dépenser {fmtMoney(perDay, currency)}/jour pendant encore {remainingDays} jours
            </>
          ) : (
            <>Dernier jour de la période</>
          )}
        </div>
      </div>
    </button>
  )
}

export default function Home({ onNavigate }) {
  const { state } = useStore()
  const { open } = useUI()
  const currency = state.settings.currency
  const [range, setRange] = useState(30)

  const balances = useMemo(() => {
    const map = new Map()
    for (const a of state.accounts) map.set(a.id, accountBalance(a, state.transactions))
    return map
  }, [state.accounts, state.transactions])

  const total = totalBalance(state.accounts, state.transactions)
  const series = useMemo(
    () => cumulativeSeries(state.accounts, state.transactions, range),
    [state.accounts, state.transactions, range],
  )

  const recent = useMemo(
    () =>
      groupByDay(state.transactions)
        .slice(0, 3)
        .flatMap(([date, txns]) => txns)
        .slice(0, 7),
    [state.transactions],
  )

  const accountById = (id) => state.accounts.find((a) => a.id === id)
  const today = new Date()
  const dateLine = `${weekdayLabel(todayISO())} ${today.getDate()} ${
    ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][today.getMonth()]
  }`

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Accueil</h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>
            {dateLine}
          </p>
        </div>
        <button className="icon-btn" onClick={() => onNavigate('more')} aria-label="Réglages">
          <EllipsisVertical size={22} />
        </button>
      </header>

      {/* Comptes */}
      <div className="carousel">
        {state.accounts.map((a, i) => (
          <button
            key={a.id}
            className={`account-card ${i === 0 ? 'featured' : ''}`}
            onClick={() => open('account', { account: a })}
          >
            <div className="account-card-head">
              <span className="account-emoji" style={{ '--c': a.color }}>
                {a.emoji}
              </span>
              <span className="account-dot" style={{ background: a.color }} />
            </div>
            <div>
              <div className="account-name">{a.name}</div>
              <div className={`account-balance ${balances.get(a.id) >= 0 ? 'pos' : ''}`}>
                {fmtMoney(balances.get(a.id), currency)}
              </div>
              <div className="account-meta">
                {state.transactions.filter((t) => t.accountId === a.id).length} transactions
              </div>
            </div>
          </button>
        ))}
        <button className="add-tile" onClick={() => open('account')}>
          <Plus size={26} />
          Compte
        </button>
      </div>

      {/* Budgets */}
      {state.budgets.length > 0 && (
        <div className="carousel" style={{ marginTop: 14 }}>
          {state.budgets.map((b) => (
            <BudgetBanner key={b.id} budget={b} />
          ))}
          <button className="add-tile" style={{ width: 130 }} onClick={() => open('budget')}>
            <Plus size={26} />
            Budget
          </button>
        </div>
      )}

      {/* Graphique */}
      <div className="card chart-card" style={{ marginTop: 14 }}>
        <div className="chart-head">
          <div>
            <div className="chart-total-label">Solde total</div>
            <div className="chart-total">{fmtMoney(series.endValue, currency)}</div>
            <div className={`chart-net ${series.net >= 0 ? 'up' : 'down'}`}>
              {series.net >= 0 ? '+' : '−'}
              {fmtMoney(Math.abs(series.net), currency)} sur {range} jours
            </div>
          </div>
          <div className="range-pills">
            {RANGES.map((r) => (
              <button
                key={r.days}
                className={range === r.days ? 'active' : ''}
                onClick={() => setRange(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <LineChart points={series.points} currency={currency} />
      </div>

      {/* Transactions récentes */}
      <div className="section-title">
        <span>Récent</span>
        <button onClick={() => onNavigate('transactions')}>Tout voir</button>
      </div>
      <div className="card list-card">
        {recent.map((tx) => (
          <TxRow
            key={tx.id}
            tx={tx}
            currency={currency}
            account={accountById(tx.accountId)}
            onClick={(t) => open('transaction', { tx: t })}
          />
        ))}
        {recent.length === 0 && (
          <div className="empty">
            <div className="emoji">🧾</div>
            <h3>Aucune transaction</h3>
            <p>Appuyez sur le bouton + pour ajouter votre première dépense.</p>
          </div>
        )}
      </div>
    </>
  )
}
