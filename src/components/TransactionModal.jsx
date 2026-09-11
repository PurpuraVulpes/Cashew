import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Pencil } from 'lucide-react'
import { Modal, Field, inputCls, Btn, Segmented, IconBadge } from './ui.jsx'
import { useFinance } from '../context/FinanceContext.jsx'
import { todayISO, cx, CURRENCIES } from '../utils/helpers.js'

const TYPES = [
  { value: 'expense', label: 'Dépense' },
  { value: 'income', label: 'Revenu' },
  { value: 'transfer', label: 'Virement' },
]

export default function TransactionModal({ open, onClose, editing = null, preset = {} }) {
  const { accounts, categories, dispatch, settings } = useFinance()
  const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || settings.currency
  const [type, setType] = useState(preset.type || 'expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setAccountId(editing.accountId)
      setToAccountId(editing.toAccountId || '')
      setCategoryId(editing.categoryId || '')
      setDate(editing.date?.slice(0, 10) || todayISO())
      setNote(editing.note || '')
    } else {
      setType(preset.type || 'expense')
      setAmount(preset.amount ? String(preset.amount) : '')
      const preferred = preset.accountId || settings.defaultAccountId
      const validPreferred = preferred && accounts.some((a) => a.id === preferred && !a.archived)
      setAccountId(validPreferred ? preferred : accounts.find((a) => !a.archived)?.id || accounts[0]?.id || '')
      setToAccountId('')
      setCategoryId(preset.categoryId || '')
      setDate(preset.date || todayISO())
      setNote(preset.note || '')
    }
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const visibleCats = useMemo(
    () => categories.filter((c) => (type === 'transfer' ? true : c.type === type)),
    [categories, type]
  )

  const submit = () => {
    const amt = Math.round(Number(String(amount).replace(',', '.')) * 100) / 100
    if (!amt || amt <= 0) return setError('Entrez un montant valide supérieur à 0.')
    if (!accountId) return setError('Choisissez un compte.')
    if (type === 'transfer') {
      if (!toAccountId) return setError('Choisissez le compte destinataire.')
      if (toAccountId === accountId) return setError('Les deux comptes doivent être différents.')
    } else if (!categoryId) return setError('Choisissez une catégorie.')
    const payload = {
      type, amount: amt, accountId,
      toAccountId: type === 'transfer' ? toAccountId : null,
      categoryId: type === 'transfer' ? null : categoryId,
      date, note: note.trim(),
    }
    if (editing) dispatch({ type: 'UPDATE_TX', payload: { ...editing, ...payload } })
    else dispatch({ type: 'ADD_TX', payload })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Modifier l’opération' : 'Nouvelle opération'}
      subtitle={editing ? 'Ajustez les détails puis enregistrez' : 'Dépense, revenu ou virement entre comptes'}
    >
      <div className="space-y-4">
        <Segmented options={TYPES} value={type} onChange={(v) => { setType(v); setCategoryId('') }} />

        <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-white/5">
          <Field label="Montant">
            <div className="flex items-center justify-center gap-1">
              <input
                autoFocus
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-44 bg-transparent text-center text-4xl font-extrabold tabular-nums text-slate-900 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600"
              />
              <span className="text-2xl font-extrabold text-slate-400">{currencySymbol}</span>
            </div>
          </Field>
        </div>

        <div className={cx('grid gap-3', type === 'transfer' ? 'grid-cols-1' : 'grid-cols-1')}>
          <Field label={type === 'transfer' ? 'Compte source' : 'Compte'}>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
              <option value="">— Choisir —</option>
              {editing && accountId && !accounts.some((a) => a.id === accountId && !a.archived) && (
                <option value={accountId}>{accounts.find((a) => a.id === accountId)?.name || 'Compte'} (archivé)</option>
              )}
              {accounts.filter((a) => !a.archived).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
          {type === 'transfer' && (
            <Field label="Compte destinataire">
              <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className={inputCls}>
                <option value="">— Choisir —</option>
                {editing && toAccountId && !accounts.some((a) => a.id === toAccountId && !a.archived) && (
                  <option value={toAccountId}>{accounts.find((a) => a.id === toAccountId)?.name || 'Compte'} (archivé)</option>
                )}
                {accounts.filter((a) => !a.archived && a.id !== accountId).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {type !== 'transfer' && (
          <Field label="Catégorie">
            {visibleCats.length === 0 ? (
              <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Aucune catégorie. Créez-en une dans l’onglet Catégories.
              </p>
            ) : (
              <div className="grid max-h-52 grid-cols-4 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 dark:border-white/10 dark:bg-white/5">
                {visibleCats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={cx(
                      'flex flex-col items-center gap-1 rounded-xl p-2 text-[11px] font-bold leading-tight transition',
                      categoryId === c.id
                        ? 'bg-white text-slate-900 shadow ring-2 ring-brand-500 dark:bg-white/15 dark:text-white'
                        : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10'
                    )}
                  >
                    <IconBadge icon={c.icon} color={c.color} size="sm" />
                    <span className="line-clamp-2">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Note (optionnel)">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : Courses" className={inputCls} maxLength={80} />
          </Field>
        </div>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Annuler</Btn>
          <Btn className="flex-[2]" onClick={submit}>
            {editing ? <Pencil className="h-4 w-4" /> : <ArrowLeftRight className="h-4 w-4" />}
            {editing ? 'Enregistrer' : type === 'expense' ? 'Ajouter la dépense' : type === 'income' ? 'Ajouter le revenu' : 'Effectuer le virement'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
