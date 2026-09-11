import { useMemo, useState } from 'react'
import { Delete, Check } from 'lucide-react'
import Sheet from '../components/Sheet.jsx'
import { useStore } from '../store.jsx'
import { categoriesForType } from '../data.js'
import { todayISO } from '../utils.js'

function formatKeypadAmount(str, currency) {
  const cur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency })
    .formatToParts(0)
    .find((p) => p.type === 'currency').value
  if (!str) return `0 ${cur}`
  const dec = str.includes('.') ? str.split('.')[1] : null
  const n = Number(str)
  if (Number.isNaN(n)) return str
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: dec ? Math.min(dec.length, 2) : 0,
    maximumFractionDigits: 2,
  }).format(n)
  const suffix = str.endsWith('.') ? ',' : ''
  return `${formatted}${suffix} ${cur}`
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back']

export default function TransactionSheet({ tx, presetType = 'expense', presetDate, onClose }) {
  const { state, dispatch } = useStore()
  const currency = state.settings.currency
  const editing = Boolean(tx)

  const [type, setType] = useState(tx?.type || presetType)
  const [amountStr, setAmountStr] = useState(tx ? String(tx.amount) : '')
  const [name, setName] = useState(tx?.name || '')
  const [categoryId, setCategoryId] = useState(
    tx?.categoryId || (presetType === 'income' ? 'salary' : 'groceries'),
  )
  const [accountId, setAccountId] = useState(tx?.accountId || state.accounts[0]?.id)
  const [date, setDate] = useState(tx?.date || presetDate || todayISO())
  const [recurring, setRecurring] = useState(Boolean(tx?.recurring))
  const [frequency, setFrequency] = useState(tx?.recurring?.frequency || 'monthly')

  const cats = useMemo(() => categoriesForType(type), [type])

  const press = (key) => {
    setAmountStr((s) => {
      if (key === 'back') return s.slice(0, -1)
      if (key === '.') {
        if (s.includes('.') || s === '') return s || '0.'
        return s + '.'
      }
      if (s.includes('.')) {
        const dec = s.split('.')[1]
        if (dec.length >= 2) return s
      } else if (s.replace('.', '').length >= 9) {
        return s
      }
      if (s === '0') return key
      return s + key
    })
  }

  const amount = parseFloat(amountStr || '0')
  const valid = amount > 0 && accountId

  const switchType = (t) => {
    setType(t)
    const newCats = categoriesForType(t)
    if (!newCats.some((c) => c.id === categoryId)) setCategoryId(newCats[0].id)
  }

  const save = () => {
    if (!valid) return
    const payload = {
      type,
      amount: Math.round(amount * 100) / 100,
      name: name.trim(),
      categoryId,
      accountId,
      date,
      recurring: recurring ? { frequency, every: 1 } : null,
    }
    if (editing) {
      dispatch({ type: 'tx/update', id: tx.id, patch: payload })
    } else {
      dispatch({ type: 'tx/add', tx: payload })
    }
    onClose()
  }

  return (
    <Sheet title={editing ? 'Modifier' : 'Ajouter une transaction'} onClose={onClose}>
      <div className="segmented">
        <button
          className={type === 'income' ? 'active income' : ''}
          onClick={() => switchType('income')}
        >
          Revenu
        </button>
        <button
          className={type === 'expense' ? 'active expense' : ''}
          onClick={() => switchType('expense')}
        >
          Dépense
        </button>
      </div>

      <div className="amount-display">
        <div className="label">Montant</div>
        <div className={`value ${type}`}>{formatKeypadAmount(amountStr, currency)}</div>
      </div>

      <div className="keypad">
        {KEYS.map((k) => (
          <button
            key={k}
            className="key"
            onClick={() => (k === 'back' ? press('back') : press(k))}
            aria-label={k === 'back' ? 'Supprimer' : k}
          >
            {k === 'back' ? <Delete size={22} style={{ margin: '0 auto' }} /> : k}
          </button>
        ))}
      </div>

      <div className="field-label">Nom de la transaction</div>
      <input
        className="text-input"
        placeholder="Ex : Courses Carrefour"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
      />

      <div className="field-label">Catégorie</div>
      <div className="category-grid">
        {cats.map((c) => (
          <button
            key={c.id}
            className={`category-choice ${categoryId === c.id ? 'selected' : ''}`}
            onClick={() => setCategoryId(c.id)}
          >
            <span className="cat-circle" style={{ '--c': c.color }}>
              {c.emoji}
            </span>
            <span className="cat-label">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="field-label">Compte</div>
      {state.accounts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)', fontWeight: 700 }}>
          Créez d'abord un compte depuis l'accueil.
        </div>
      ) : (
      <select className="select-input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {state.accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.emoji} {a.name}
          </option>
        ))}
      </select>
      )}

      <div className="field-label">Date</div>
      <input
        type="date"
        className="date-input"
        value={date}
        max={todayISO()}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="form-row">
        <span className="form-row-label">Transaction récurrente</span>
        <button
          className={`switch ${recurring ? 'on' : ''}`}
          onClick={() => setRecurring((v) => !v)}
          aria-pressed={recurring}
          aria-label="Récurrent"
        />
      </div>
      {recurring && (
        <select
          className="select-input"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="weekly">Chaque semaine</option>
          <option value="monthly">Chaque mois</option>
          <option value="yearly">Chaque année</option>
        </select>
      )}

      <button className="btn-primary" onClick={save} disabled={!valid}>
        {editing ? 'Enregistrer' : 'Ajouter'}
      </button>
      {editing && (
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm('Supprimer cette transaction ?')) {
              dispatch({ type: 'tx/delete', id: tx.id })
              onClose()
            }
          }}
        >
          <Delete size={17} /> Supprimer
        </button>
      )}
    </Sheet>
  )
}
