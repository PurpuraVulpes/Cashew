import { useState } from 'react'
import { Delete } from 'lucide-react'
import Sheet from '../components/Sheet.jsx'
import { useStore } from '../store.jsx'
import { ACCOUNT_COLORS, ACCOUNT_EMOJIS } from '../data.js'

export default function AccountSheet({ account, onClose }) {
  const { state, dispatch } = useStore()
  const editing = Boolean(account)

  const [name, setName] = useState(account?.name || '')
  const [emoji, setEmoji] = useState(account?.emoji || '💳')
  const [color, setColor] = useState(account?.color || ACCOUNT_COLORS[0])
  const [initial, setInitial] = useState(
    account ? String(account.initialBalance ?? 0) : '0',
  )
  const [includeInTotal, setIncludeInTotal] = useState(account?.includeInTotal !== false)

  const usedByOthers = state.transactions.some((t) => t.accountId === account?.id)
  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    const payload = {
      name: name.trim(),
      emoji,
      color,
      initialBalance: Math.round(parseFloat(initial || '0') * 100) / 100,
      includeInTotal,
    }
    if (editing) dispatch({ type: 'acc/update', id: account.id, patch: payload })
    else dispatch({ type: 'acc/add', acc: payload })
    onClose()
  }

  return (
    <Sheet title={editing ? 'Modifier le compte' : 'Nouveau compte'} onClose={onClose}>
      <div className="field-label">Nom du compte</div>
      <input
        className="text-input"
        placeholder="Ex : Banque, Espèces…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
      />

      <div className="field-label">Icône</div>
      <div className="picker-grid">
        {ACCOUNT_EMOJIS.map((e) => (
          <button
            key={e}
            className={`picker-tile ${emoji === e ? 'selected' : ''}`}
            onClick={() => setEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="field-label">Couleur</div>
      <div className="picker-grid">
        {ACCOUNT_COLORS.map((c) => (
          <button
            key={c}
            className={`picker-tile ${color === c ? 'selected' : ''}`}
            onClick={() => setColor(c)}
            aria-label={`Couleur ${c}`}
          >
            <span className="color-swatch" style={{ background: c }} />
          </button>
        ))}
      </div>

      <div className="field-label">Solde initial</div>
      <input
        className="text-input"
        type="number"
        inputMode="decimal"
        step="0.01"
        value={initial}
        onChange={(e) => setInitial(e.target.value)}
      />

      <div className="form-row">
        <span className="form-row-label">Inclure dans le solde total</span>
        <button
          className={`switch ${includeInTotal ? 'on' : ''}`}
          onClick={() => setIncludeInTotal((v) => !v)}
          aria-pressed={includeInTotal}
          aria-label="Inclure dans le total"
        />
      </div>

      <button className="btn-primary" onClick={save} disabled={!valid}>
        {editing ? 'Enregistrer' : 'Créer le compte'}
      </button>
      {editing && (
        <button
          className="btn-danger"
          onClick={() => {
            const msg = usedByOthers
              ? 'Supprimer ce compte et toutes ses transactions ?'
              : 'Supprimer ce compte ?'
            if (confirm(msg)) {
              dispatch({ type: 'acc/delete', id: account.id })
              onClose()
            }
          }}
        >
          <Delete size={17} /> Supprimer le compte
        </button>
      )}
    </Sheet>
  )
}
