import React, { useEffect, useState } from 'react'
import { Trash2, TriangleAlert } from 'lucide-react'
import { Modal, Field, inputCls, Btn, IconBadge, Segmented } from './ui.jsx'
import { useFinance } from '../context/FinanceContext.jsx'
import { CATEGORY_ICONS, PALETTE, ACCOUNT_TYPES } from '../data/seed.js'
import { todayISO, cx } from '../utils/helpers.js'

/* ---------- Confirmation ---------- */
export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirmer ?', message, danger = true, confirmLabel = 'Confirmer' }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <span className={cx(
          'flex h-14 w-14 items-center justify-center rounded-full',
          danger ? 'bg-rose-500/10 text-rose-500' : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
        )}>
          <TriangleAlert className="h-7 w-7" />
        </span>
        {message && <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>}
        <div className="mt-6 flex w-full gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn
            variant={danger ? 'solidDanger' : 'primary'}
            className="flex-1"
            onClick={() => { onConfirm?.(); onClose() }}
          >
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Compte ---------- */
export function AccountModal({ open, onClose, editing }) {
  const { dispatch } = useFinance()
  const [name, setName] = useState('')
  const [type, setType] = useState('courant')
  const [color, setColor] = useState(PALETTE[0])
  const [initialBalance, setInitialBalance] = useState('0')

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setType(editing?.type || 'courant')
    setColor(editing?.color || PALETTE[0])
    setInitialBalance(String(editing?.initialBalance ?? 0))
  }, [open, editing])

  const submit = () => {
    if (!name.trim()) return
    const icon = ACCOUNT_TYPES.find((t) => t.id === type)?.icon || 'bank'
    const payload = { name: name.trim(), type, color, icon, initialBalance: Number(String(initialBalance).replace(',', '.')) || 0, archived: editing?.archived || false }
    if (editing) dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...editing, ...payload } })
    else dispatch({ type: 'ADD_ACCOUNT', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Modifier le compte' : 'Nouveau compte'} subtitle="Courant, épargne, espèces…">
      <div className="space-y-4">
        <Field label="Nom du compte">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Compte joint" className={inputCls} maxLength={40} />
        </Field>
        <Field label="Type de compte">
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)} className={cx('flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-bold transition', type === t.id ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300')}>
                <IconBadge icon={t.icon} color={color} size="xs" /> {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Solde initial">
          <input inputMode="decimal" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Couleur">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={c} className={cx('h-9 w-9 rounded-full transition', color === c && 'ring-[3px] ring-offset-2 ring-slate-900/20 dark:ring-white/30')} style={{ backgroundColor: c }} />
            ))}
          </div>
        </Field>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>{editing ? 'Enregistrer' : 'Créer le compte'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Catégorie ---------- */
export function CategoryModal({ open, onClose, editing, defaultType = 'expense' }) {
  const { dispatch } = useFinance()
  const [name, setName] = useState('')
  const [type, setType] = useState(defaultType)
  const [icon, setIcon] = useState('cart')
  const [color, setColor] = useState(PALETTE[0])

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setType(editing?.type || defaultType)
    setIcon(editing?.icon || 'cart')
    setColor(editing?.color || PALETTE[0])
  }, [open, editing, defaultType])

  const submit = () => {
    if (!name.trim()) return
    const payload = { name: name.trim(), type, icon, color }
    if (editing) dispatch({ type: 'UPDATE_CATEGORY', payload: { ...editing, ...payload } })
    else dispatch({ type: 'ADD_CATEGORY', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
      <div className="space-y-4">
        <Segmented options={[{ value: 'expense', label: 'Dépense' }, { value: 'income', label: 'Revenu' }]} value={type} onChange={setType} />
        <div className="flex items-center gap-3">
          <IconBadge icon={icon} color={color} size="lg" />
          <Field label="Nom" className="flex-1">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Animaux" className={inputCls} maxLength={30} />
          </Field>
        </div>
        <Field label="Icône">
          <div className="grid grid-cols-8 gap-1.5">
            {CATEGORY_ICONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} className={cx('flex items-center justify-center rounded-xl p-2 transition', icon === ic ? 'bg-brand-500/15 ring-2 ring-brand-500' : 'hover:bg-slate-100 dark:hover:bg-white/10')}>
                <IconBadge icon={ic} color={color} size="xs" />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Couleur">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={c} className={cx('h-9 w-9 rounded-full transition', color === c && 'ring-[3px] ring-offset-2 ring-slate-900/20 dark:ring-white/30')} style={{ backgroundColor: c }} />
            ))}
          </div>
        </Field>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>{editing ? 'Enregistrer' : 'Créer la catégorie'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Budget ---------- */
export function BudgetModal({ open, onClose, editing }) {
  const { categories, budgets, dispatch } = useFinance()
  const expenseCats = categories.filter((c) => c.type === 'expense')
  const [categoryId, setCategoryId] = useState('all')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!open) return
    setCategoryId(editing?.categoryId || 'all')
    setAmount(editing ? String(editing.amount) : '')
  }, [open, editing])

  const submit = () => {
    const amt = Number(String(amount).replace(',', '.'))
    if (!amt || amt <= 0) return
    dispatch({ type: 'UPSERT_BUDGET', payload: { categoryId, amount: Math.round(amt * 100) / 100 } })
    onClose()
  }

  const usedIds = new Set(budgets.map((b) => b.categoryId))

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Modifier le budget' : 'Nouveau budget'} subtitle="Budget mensuel, réinitialisé chaque mois">
      <div className="space-y-4">
        <Field label="Catégorie">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls} disabled={!!editing}>
            <option value="all">🌍 Budget global (toutes dépenses)</option>
            {expenseCats.map((c) => (
              <option key={c.id} value={c.id} disabled={!editing && usedIds.has(c.id)}>
                {c.name}{!editing && usedIds.has(c.id) ? ' — déjà budgété' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Montant mensuel">
          <input inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex : 400" className={inputCls} />
        </Field>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>{editing ? 'Enregistrer' : 'Créer le budget'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Objectif ---------- */
export function GoalModal({ open, onClose, editing }) {
  const { dispatch } = useFinance()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('0')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [icon, setIcon] = useState('piggy')

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setTarget(editing ? String(editing.target) : '')
    setSaved(String(editing?.saved ?? 0))
    setDeadline(editing?.deadline || '')
    setColor(editing?.color || PALETTE[0])
    setIcon(editing?.icon || 'piggy')
  }, [open, editing])

  const submit = () => {
    if (!name.trim()) return
    const t = Number(String(target).replace(',', '.'))
    if (!t || t <= 0) return
    const payload = { name: name.trim(), target: t, saved: Number(String(saved).replace(',', '.')) || 0, deadline, color, icon }
    if (editing) dispatch({ type: 'UPDATE_GOAL', payload: { ...editing, ...payload } })
    else dispatch({ type: 'ADD_GOAL', payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Modifier l'objectif" : 'Nouvel objectif'} subtitle="Projet, voyage, apport…">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={icon} color={color} size="lg" />
          <Field label="Nom" className="flex-1">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Vacances au Japon" className={inputCls} maxLength={40} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant cible">
            <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="3500" className={inputCls} />
          </Field>
          <Field label="Déjà épargné">
            <input inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Échéance (optionnel)">
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Icône">
          <div className="flex gap-1.5">
            {['piggy', 'plane', 'home', 'car', 'gift', 'phone', 'fun', 'money'].map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} className={cx('rounded-xl p-2 transition', icon === ic ? 'bg-brand-500/15 ring-2 ring-brand-500' : 'hover:bg-slate-100 dark:hover:bg-white/10')}>
                <IconBadge icon={ic} color={color} size="xs" />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Couleur">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={c} className={cx('h-9 w-9 rounded-full transition', color === c && 'ring-[3px] ring-offset-2 ring-slate-900/20 dark:ring-white/30')} style={{ backgroundColor: c }} />
            ))}
          </div>
        </Field>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>{editing ? 'Enregistrer' : "Créer l'objectif"}</Btn>
        </div>
      </div>
    </Modal>
  )
}

export function GoalFundModal({ open, onClose, goal }) {
  const { dispatch } = useFinance()
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('add')

  useEffect(() => { if (open) { setAmount(''); setMode('add') } }, [open])

  if (!goal) return null
  const submit = () => {
    const amt = Number(String(amount).replace(',', '.'))
    if (!amt || amt <= 0) return
    const saved = mode === 'add' ? goal.saved + amt : Math.max(0, goal.saved - amt)
    dispatch({ type: 'UPDATE_GOAL', payload: { ...goal, saved: Math.round(saved * 100) / 100 } })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={goal.name} subtitle="Ajuster l'épargne de cet objectif">
      <div className="space-y-4">
        <Segmented options={[{ value: 'add', label: '＋ Ajouter' }, { value: 'remove', label: '－ Retirer' }]} value={mode} onChange={setMode} />
        <Field label="Montant">
          <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className={inputCls} />
        </Field>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>Valider</Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Abonnement / récurrent ---------- */
const FREQS = [
  { value: 'weekly', label: 'Hebdo' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
]

export function RecurringModal({ open, onClose, editing }) {
  const { accounts, categories, dispatch } = useFinance()
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextDate, setNextDate] = useState(todayISO())

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setType(editing?.type || 'expense')
    setAmount(editing ? String(editing.amount) : '')
    setCategoryId(editing?.categoryId || '')
    setAccountId(editing?.accountId || accounts[0]?.id || '')
    setFrequency(editing?.frequency || 'monthly')
    setNextDate(editing?.nextDate || todayISO())
  }, [open, editing, accounts])

  const submit = () => {
    const amt = Number(String(amount).replace(',', '.'))
    if (!name.trim() || !amt || amt <= 0) return
    const payload = { name: name.trim(), type, amount: amt, categoryId, accountId, frequency, nextDate, active: editing?.active ?? true }
    if (editing) dispatch({ type: 'UPDATE_RECURRING', payload: { ...editing, ...payload } })
    else dispatch({ type: 'ADD_RECURRING', payload })
    onClose()
  }

  const cats = categories.filter((c) => c.type === type)

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Modifier l'abonnement" : 'Nouvel abonnement'} subtitle="Prélèvement ou revenu récurrent">
      <div className="space-y-4">
        <Segmented options={[{ value: 'expense', label: 'Dépense' }, { value: 'income', label: 'Revenu' }]} value={type} onChange={(v) => { setType(v); setCategoryId('') }} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Netflix" className={inputCls} maxLength={40} />
          </Field>
          <Field label="Montant">
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="13,49" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Compte">
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
              {accounts.filter((a) => !a.archived).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fréquence">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
              {FREQS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Prochaine échéance">
            <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>{editing ? 'Enregistrer' : 'Créer'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

export function DeleteButton({ onClick, label = 'Supprimer' }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-500/10">
      <Trash2 className="h-3.5 w-3.5" /> {label}
    </button>
  )
}
