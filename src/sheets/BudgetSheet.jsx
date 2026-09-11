import { useState } from 'react'
import { Delete, Check } from 'lucide-react'
import Sheet from '../components/Sheet.jsx'
import { useStore } from '../store.jsx'
import { CATEGORIES } from '../data.js'
import { toISODate, startOfMonth, addDays } from '../utils.js'

const EXPENSE_CATS = CATEGORIES.filter((c) => c.type === 'expense')

export default function BudgetSheet({ budget, onClose }) {
  const { state, dispatch } = useStore()
  const editing = Boolean(budget)

  const [name, setName] = useState(budget?.name || '')
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '')
  const [period, setPeriod] = useState(budget?.period || 'monthly')
  const [startDate, setStartDate] = useState(
    budget?.startDate || toISODate(startOfMonth(new Date())),
  )
  const [endDate, setEndDate] = useState(
    budget?.endDate || toISODate(addDays(startOfMonth(new Date()), 29)),
  )
  const [categoryIds, setCategoryIds] = useState(budget?.categoryIds || [])

  const toggleCat = (id) =>
    setCategoryIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const valid = name.trim() && parseFloat(amount) > 0

  const save = () => {
    if (!valid) return
    const payload = {
      name: name.trim(),
      amount: Math.round(parseFloat(amount) * 100) / 100,
      period,
      startDate,
      endDate: period === 'oneoff' ? endDate : null,
      categoryIds,
    }
    if (editing) dispatch({ type: 'bud/update', id: budget.id, patch: payload })
    else dispatch({ type: 'bud/add', bud: payload })
    onClose()
  }

  return (
    <Sheet title={editing ? 'Modifier le budget' : 'Nouveau budget'} onClose={onClose}>
      <div className="segmented">
        <button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>
          Mensuel
        </button>
        <button className={period === 'weekly' ? 'active' : ''} onClick={() => setPeriod('weekly')}>
          Hebdo
        </button>
        <button className={period === 'oneoff' ? 'active' : ''} onClick={() => setPeriod('oneoff')}>
          Unique
        </button>
      </div>

      <div className="field-label">Nom du budget</div>
      <input
        className="text-input"
        placeholder="Ex : Alimentation, Voyage…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
      />

      <div className="field-label">Montant</div>
      <input
        className="text-input"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="field-label">{period === 'oneoff' ? 'Date de début' : 'Date de référence'}</div>
      <input
        type="date"
        className="date-input"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      {period === 'oneoff' && (
        <>
          <div className="field-label">Date de fin</div>
          <input
            type="date"
            className="date-input"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </>
      )}

      <div className="field-label">Catégories suivies ({categoryIds.length})</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {EXPENSE_CATS.map((c) => {
          const selected = categoryIds.includes(c.id)
          return (
            <button
              key={c.id}
              className="filter-chip"
              style={{
                '--c': c.color,
                ...(selected
                  ? {
                      background: 'color-mix(in srgb, var(--c) 22%, transparent)',
                      borderColor: 'var(--c)',
                      color: 'var(--text)',
                    }
                  : {}),
              }}
              onClick={() => toggleCat(c.id)}
            >
              <span style={{ color: selected ? 'var(--c)' : undefined, display: 'flex' }}>
                {selected ? <Check size={13} /> : c.emoji}
              </span>
              {c.label}
            </button>
          )
        })}
      </div>
      <p className="about-text" style={{ marginTop: 8 }}>
        Sans catégorie sélectionnée, le budget suivra toutes vos dépenses.
      </p>

      <button className="btn-primary" onClick={save} disabled={!valid}>
        {editing ? 'Enregistrer' : 'Créer le budget'}
      </button>
      {editing && (
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm('Supprimer ce budget ?')) {
              dispatch({ type: 'bud/delete', id: budget.id })
              onClose()
            }
          }}
        >
          <Delete size={17} /> Supprimer le budget
        </button>
      )}
    </Sheet>
  )
}
