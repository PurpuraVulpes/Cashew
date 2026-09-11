import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, PieChart as PieIcon } from 'lucide-react'
import { useStore } from '../store.jsx'
import { useUI } from '../ui.jsx'
import { Donut } from '../components/Charts.jsx'
import { categoryById } from '../data.js'
import {
  categoryTotals,
  fmtMoney,
  toISODate,
  startOfMonth,
  endOfMonth,
  addMonths,
  periodSpent,
  clamp,
} from '../utils.js'

const MONTHS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export default function Budgets() {
  const { state } = useStore()
  const { open } = useUI()
  const currency = state.settings.currency
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const mStart = toISODate(startOfMonth(month))
  const mEnd = toISODate(endOfMonth(month))
  const isCurrentMonth = toISODate(startOfMonth(new Date())) === mStart

  const totals = useMemo(
    () => categoryTotals(state.transactions, month),
    [state.transactions, month],
  )

  const donutData = useMemo(
    () =>
      [...totals.entries()]
        .map(([id, value]) => ({ id, value, color: categoryById(id).color }))
        .sort((a, b) => b.value - a.value),
    [totals],
  )
  const monthTotal = donutData.reduce((s, d) => s + d.value, 0)

  return (
    <>
      <header className="page-header">
        <h1 className="header-title">Budgets</h1>
      </header>

      <div className="month-picker">
        <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mois précédent">
          <ChevronLeft size={22} />
        </button>
        <div className="label">
          {MONTHS_LONG[month.getMonth()]} {month.getFullYear()}
        </div>
        <button
          className="icon-btn"
          onClick={() => !isCurrentMonth && setMonth(addMonths(month, 1))}
          style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
          aria-label="Mois suivant"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 6 }}>
          Dépenses par catégorie
        </div>
        {monthTotal > 0 ? (
          <>
            <Donut data={donutData} currency={currency} centerLabel="Dépensé" />
            <div className="legend">
              {donutData.map((d) => {
                const cat = categoryById(d.id)
                const pct = Math.round((d.value / monthTotal) * 100)
                return (
                  <div className="legend-row" key={d.id}>
                    <span className="legend-dot" style={{ background: d.color }} />
                    <span className="legend-label">
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="legend-values">
                      <div className="legend-amount">{fmtMoney(d.value, currency)}</div>
                      <div className="legend-pct">{pct} %</div>
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="empty">
            <PieIcon size={42} color="var(--text-faint)" style={{ marginBottom: 8 }} />
            <h3>Aucune dépense</h3>
            <p>Il n'y a pas encore de transaction pour ce mois.</p>
          </div>
        )}
      </div>

      <div className="section-title">
        <span>Mes budgets</span>
      </div>
      <div className="card" style={{ padding: 6 }}>
        {state.budgets.map((b) => {
          const spent = periodSpent(state.transactions, mStart, mEnd, b.categoryIds)
          const pct = clamp((spent / b.amount) * 100, 0, 100)
          const left = b.amount - spent
          const over = spent > b.amount
          const periodLabel =
            b.period === 'monthly' ? 'Mensuel' : b.period === 'weekly' ? 'Hebdo' : 'Unique'
          return (
            <button key={b.id} className="budget-row" onClick={() => open('budget', { budget: b })}>
              <span className="budget-row-icon">
                <PieIcon size={21} color="#fff" />
              </span>
              <span className="budget-row-main">
                <span className="budget-row-top" style={{ display: 'block' }}>
                  <span>{b.name}</span>
                  <span style={{ color: over ? 'var(--down)' : 'var(--text-dim)', fontSize: 13 }}>
                    {periodLabel}
                  </span>
                </span>
                <span className="mini-track" style={{ display: 'block' }}>
                  <span
                    className={`mini-fill ${over ? 'over' : ''}`}
                    style={{ width: `${pct}%`, display: 'block' }}
                  />
                </span>
                <span className="budget-row-sub" style={{ display: 'block' }}>
                  {over
                    ? `Dépassé de ${fmtMoney(Math.abs(left), currency)}`
                    : `${fmtMoney(left, currency)} restants sur ${fmtMoney(b.amount, currency)}`}
                  {' · '}
                  {Math.round((spent / b.amount) * 100)}%
                </span>
              </span>
              <ChevronRight size={18} color="var(--text-faint)" />
            </button>
          )
        })}
        {state.budgets.length === 0 && (
          <div className="empty" style={{ padding: '30px 20px' }}>
            <h3>Aucun budget</h3>
            <p>Créez un budget pour suivre vos dépenses par catégorie.</p>
          </div>
        )}
        <button className="add-row" onClick={() => open('budget')}>
          <Plus size={18} /> Ajouter un budget
        </button>
      </div>
    </>
  )
}
