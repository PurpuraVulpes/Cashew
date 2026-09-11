import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Moon, Sun, Download, Upload, Trash2, RefreshCcw, RotateCcw, User, Coins,
  ShieldCheck, Info, ChevronDown, Palette, Check, Pencil, Plus, Briefcase,
  SlidersHorizontal, Database, HandCoins, Lock, KeyRound,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { useLock } from '../context/LockContext.jsx'
import { Card, Btn, Field, inputCls, Avatar, Money, IconBadge, Segmented, ProgressBar } from '../components/ui.jsx'
import { MobileHeader, PageHeader } from '../components/Layout.jsx'
import { ConfirmModal, AccountModal, CategoryModal, BudgetModal, GoalModal, GoalFundModal, RecurringModal } from '../components/Modals.jsx'
import { PinSetupModal, PinVerifyModal } from '../components/Lock.jsx'
import { THEMES, DEFAULT_THEME_ID } from '../data/themes.js'
import { SHIFT_TYPES } from '../utils/work.js'
import { ACCOUNT_TYPES } from '../data/seed.js'
import { CURRENCIES, downloadFile, cx, currentMonthKey, monthKeyOf } from '../utils/helpers.js'

function Toggle({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={cx('relative h-7 shrink-0 rounded-full transition', on ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/15')}
      style={{ width: 52 }}
      aria-label={label}
    >
      <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[28px]' : 'left-1')} />
    </button>
  )
}

function Row({ icon, color, title, subtitle, right, onEdit, onDelete, extra }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <IconBadge icon={icon} color={color} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        {subtitle && <p className="truncate text-xs font-medium text-slate-400">{subtitle}</p>}
        {extra}
      </div>
      {right}
      <div className="flex shrink-0 items-center">
        {onEdit && (
          <button onClick={onEdit} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200" aria-label="Modifier">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500" aria-label="Supprimer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function ManageSection({ id, icon, color, title, count, openId, setOpenId, onAdd, addLabel, children, empty }) {
  const open = openId === id
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpenId(open ? null : id)} className="flex w-full items-center gap-3 p-4 text-left">
        <IconBadge icon={icon} color={color} size="sm" />
        <span className="flex-1 text-sm font-extrabold text-slate-900 dark:text-white">{title}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold tabular-nums text-slate-500 dark:bg-white/10 dark:text-slate-300">{count}</span>
        <ChevronDown className={cx('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="anim-fade border-t border-slate-100 py-1 dark:border-white/5">
          {empty ? (
            <p className="px-4 py-4 text-center text-xs font-medium text-slate-400">{empty}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">{children}</div>
          )}
          <div className="p-3">
            <Btn variant="soft" className="w-full !py-2.5 text-xs" onClick={onAdd}>
              <Plus className="h-3.5 w-3.5" /> {addLabel}
            </Btn>
          </div>
        </div>
      )}
    </Card>
  )
}

const DELETE_ACTION = {
  account: 'DELETE_ACCOUNT', category: 'DELETE_CATEGORY', budget: 'DELETE_BUDGET',
  goal: 'DELETE_GOAL', recurring: 'DELETE_RECURRING',
}

const DELETE_TITLE = {
  account: 'Supprimer ce compte ?',
  category: 'Supprimer cette catégorie ?',
  budget: 'Supprimer ce budget ?',
  goal: 'Supprimer cet objectif ?',
  recurring: 'Supprimer cet abonnement ?',
}

const WIDGET_DEFS = [
  { id: 'flow', label: 'Graphique 30 jours', hint: 'Flux revenus / dépenses' },
  { id: 'mix', label: 'Budgets & catégories', hint: 'Aperçus du mois en cours' },
  { id: 'work', label: 'Paie estimée', hint: 'Rappel du module Travail' },
  { id: 'recent', label: 'Opérations récentes', hint: 'Dernières transactions' },
]

export default function Settings({ setView }) {
  const {
    state, settings, dispatch, transactions, accounts, categories, budgets,
    goals, recurring, shifts, work, balances, categoryById, accountById,
  } = useFinance()
  const lock = useLock()

  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmSettings, setConfirmSettings] = useState(false)
  const [notice, setNotice] = useState('')
  const [openId, setOpenId] = useState(null)
  const [modal, setModal] = useState(null) // { kind, item|null }
  const [deleting, setDeleting] = useState(null) // { kind, item }
  const [funding, setFunding] = useState(null)
  const [catTab, setCatTab] = useState('expense')
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupLength, setSetupLength] = useState(4)
  const [verifyAction, setVerifyAction] = useState(null) // 'disable' | 'change'
  const fileRef = useRef(null)

  // Brouillon de la config Travail (modifiée dans les paramètres)
  const [draft, setDraft] = useState(null)
  useEffect(() => {
    setDraft({
      hourlyRate: String(work.hourlyRate ?? ''),
      payDay: work.payDay ?? 5,
      weeklyTarget: String(work.weeklyTarget ?? 35),
      defaultStart: work.defaultStart || '09:00',
      defaultEnd: work.defaultEnd || '18:00',
      defaultBreak: String(work.defaultBreak ?? 60),
      rates: { ...work.rates },
    })
  }, [work])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const saveWork = () => {
    if (!draft) return
    const rate = Number(String(draft.hourlyRate).replace(',', '.'))
    if (!rate || rate <= 0) return flash('❌ Taux horaire invalide')
    const cleanRates = {}
    for (const t of SHIFT_TYPES) {
      const v = Number(String(draft.rates[t.id] ?? t.defaultMult).replace(',', '.'))
      cleanRates[t.id] = v > 0 ? v : t.defaultMult
    }
    dispatch({
      type: 'UPDATE_WORK',
      payload: {
        hourlyRate: Math.round(rate * 100) / 100,
        payDay: Math.min(28, Math.max(1, Number(draft.payDay) || 5)),
        weeklyTarget: Math.max(0, Number(String(draft.weeklyTarget).replace(',', '.')) || 0),
        defaultStart: draft.defaultStart,
        defaultEnd: draft.defaultEnd,
        defaultBreak: Math.max(0, Number(draft.defaultBreak) || 0),
        rates: cleanRates,
      },
    })
    flash('Paramètres de travail enregistrés ✅')
  }

  const exportJSON = () => {
    downloadFile(`cashew-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2))
    flash('Sauvegarde téléchargée ✅')
  }

  const importJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.accounts)) throw new Error('bad')
        dispatch({ type: 'IMPORT', payload: data })
        flash('Données importées avec succès ✅')
      } catch {
        flash('❌ Fichier invalide. Import annulé.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const spentByCat = useMemo(() => {
    const m = {}
    const mk = currentMonthKey()
    for (const t of transactions.filter((t) => monthKeyOf(t.date) === mk && t.type === 'expense')) {
      m[t.categoryId] = (m[t.categoryId] || 0) + (Number(t.amount) || 0)
    }
    return m
  }, [transactions])
  const monthExpense = useMemo(
    () => transactions.filter((t) => monthKeyOf(t.date) === currentMonthKey() && t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [transactions]
  )

  const widgets = settings.widgets || {}
  const setWidget = (id, v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { widgets: { ...widgets, [id]: v } } })
  const set = (payload) => dispatch({ type: 'UPDATE_SETTINGS', payload })

  const closeModal = () => setModal(null)
  const openAdd = (kind) => setModal({ kind, item: null })
  const openEdit = (kind, item) => setModal({ kind, item })

  return (
    <div>
      <MobileHeader title="Paramètres" subtitle="Tout régler au même endroit" onProfile={() => {}} />
      <PageHeader title="Paramètres" subtitle="Profil, apparence, préférences et gestion de toutes vos données" />

      <div className="stagger mx-auto max-w-2xl space-y-4 pb-24 lg:pb-8">
        {notice && (
          <div className="anim-pop rounded-2xl bg-brand-500/10 px-4 py-3 text-center text-sm font-bold text-brand-700 dark:text-brand-300">
            {notice}
          </div>
        )}

        {/* ---------- Profil ---------- */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><User className="h-4 w-4 text-brand-500" /> Profil</h3>
          <div className="flex items-center gap-4">
            <Avatar name={settings.name} className="h-16 w-16 text-xl" />
            <Field label="Votre prénom" className="flex-1">
              <input value={settings.name || ''} onChange={(e) => set({ name: e.target.value })} placeholder="Ex : Camille" className={inputCls} maxLength={30} />
            </Field>
          </div>
        </Card>

        {/* ---------- Apparence ---------- */}
        <Card className="p-5">
          <h3 className="mb-1 flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><Palette className="h-4 w-4 text-brand-500" /> Apparence</h3>
          <p className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">Couleur d'accent et mode d'affichage</p>
          <div className="grid grid-cols-4 gap-2.5">
            {THEMES.map((t) => {
              const active = (settings.themeColor || DEFAULT_THEME_ID) === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => set({ themeColor: t.id })}
                  className={cx(
                    'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition active:scale-95',
                    active ? 'border-slate-900 dark:border-white' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                  )}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${t.shades[400]}, ${t.shades[600]})` }}
                  >
                    {active && <Check className="h-5 w-5 text-white" strokeWidth={3} />}
                  </span>
                  <span className={cx('text-[11px] font-bold', active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400')}>
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                {settings.theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">Mode sombre</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{settings.theme === 'dark' ? 'Activé' : 'Désactivé'}</p>
              </div>
            </div>
            <Toggle on={settings.theme === 'dark'} onClick={() => set({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} label="Basculer le thème" />
          </div>
        </Card>

        {/* ---------- Sécurité ---------- */}
        <Card className="space-y-4 p-5">
          <div>
            <h3 className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><Lock className="h-4 w-4 text-brand-500" /> Sécurité</h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">Protégez l'accès avec un code PIN à 4 ou 6 chiffres</p>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Verrouillage par code</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {lock.enabled ? `Actif · code à ${lock.length} chiffres` : 'Désactivé'}
              </p>
            </div>
            <Toggle
              on={lock.enabled}
              onClick={() => {
                if (lock.enabled) setVerifyAction('disable')
                else {
                  setSetupLength(lock.length || 4)
                  setSetupOpen(true)
                }
              }}
              label="Verrouillage par code"
            />
          </div>
          {lock.enabled && (
            <>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Longueur du code</p>
                <Segmented
                  options={[{ value: 4, label: '4 chiffres' }, { value: 6, label: '6 chiffres' }]}
                  value={lock.length}
                  onChange={(v) => {
                    if (v !== lock.length) {
                      setSetupLength(v)
                      setSetupOpen(true)
                    }
                  }}
                />
                <p className="mt-1.5 text-[11px] font-medium text-slate-400">Changer de longueur redéfinit le code.</p>
              </div>
              <Field label="Verrouillage automatique">
                <select value={lock.delay} onChange={(e) => lock.setDelay(Number(e.target.value))} className={inputCls}>
                  <option value={1}>Après 1 minute d'inactivité</option>
                  <option value={5}>Après 5 minutes d'inactivité</option>
                  <option value={15}>Après 15 minutes d'inactivité</option>
                  <option value={30}>Après 30 minutes d'inactivité</option>
                  <option value={0}>Uniquement à la fermeture de l'onglet</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Btn variant="secondary" onClick={() => setVerifyAction('change')}>
                  <KeyRound className="h-4 w-4" /> Changer le code
                </Btn>
                <Btn variant="soft" onClick={() => lock.lock()}>
                  <Lock className="h-4 w-4" /> Verrouiller
                </Btn>
              </div>
            </>
          )}
        </Card>

        {/* ---------- Préférences ---------- */}
        <Card className="space-y-4 p-5">
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><SlidersHorizontal className="h-4 w-4 text-brand-500" /> Préférences</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Devise">
              <select value={settings.currency || 'EUR'} onChange={(e) => set({ currency: e.target.value })} className={inputCls}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Compte par défaut">
              <select value={settings.defaultAccountId || ''} onChange={(e) => set({ defaultAccountId: e.target.value })} className={inputCls}>
                <option value="">Premier compte actif</option>
                {accounts.filter((a) => !a.archived).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Premier jour de la semaine</p>
            <Segmented
              options={[{ value: 'monday', label: 'Lundi' }, { value: 'sunday', label: 'Dimanche' }]}
              value={settings.weekStart || 'monday'}
              onChange={(v) => set({ weekStart: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Masquer les montants</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Floute les soldes sur l'accueil</p>
            </div>
            <Toggle on={!!settings.hideBalances} onClick={() => set({ hideBalances: !settings.hideBalances })} label="Masquer les montants" />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Widgets de l'accueil</p>
            <div className="space-y-2">
              {WIDGET_DEFS.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">{w.label}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{w.hint}</p>
                  </div>
                  <Toggle on={widgets[w.id] ?? true} onClick={() => setWidget(w.id, !(widgets[w.id] ?? true))} label={w.label} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ---------- Travail ---------- */}
        <Card className="p-5">
          <h3 className="mb-1 flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><Briefcase className="h-4 w-4 text-brand-500" /> Travail</h3>
          <p className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">Taux horaire, majorations et horaires habituels</p>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Taux horaire net">
                  <input inputMode="decimal" value={draft.hourlyRate} onChange={(e) => setDraft({ ...draft, hourlyRate: e.target.value })} className={inputCls} placeholder="15,50" />
                </Field>
                <Field label="Paie vers le">
                  <input type="number" min="1" max="28" value={draft.payDay} onChange={(e) => setDraft({ ...draft, payDay: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Objectif hebdo (h)">
                  <input inputMode="decimal" value={draft.weeklyTarget} onChange={(e) => setDraft({ ...draft, weeklyTarget: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Majorations (×)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SHIFT_TYPES.filter((t) => t.id !== 'normal').map((t) => (
                    <label key={t.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                      <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">{t.short}</span>
                      <span className="mt-1.5 flex items-center gap-1">
                        <span className="text-sm font-extrabold text-slate-400">×</span>
                        <input
                          inputMode="decimal"
                          value={draft.rates[t.id] ?? ''}
                          onChange={(e) => setDraft({ ...draft, rates: { ...draft.rates, [t.id]: e.target.value } })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-extrabold outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Début habituel">
                  <input type="time" value={draft.defaultStart} onChange={(e) => setDraft({ ...draft, defaultStart: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Fin habituelle">
                  <input type="time" value={draft.defaultEnd} onChange={(e) => setDraft({ ...draft, defaultEnd: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Pause (min)">
                  <input type="number" min="0" max="600" step="5" value={draft.defaultBreak} onChange={(e) => setDraft({ ...draft, defaultBreak: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Btn className="w-full" onClick={saveWork}>Enregistrer les paramètres de travail</Btn>
            </div>
          )}
        </Card>

        {/* ---------- Gérer le contenu ---------- */}
        <div className="space-y-2.5">
          <h3 className="flex items-center gap-2 px-1 font-extrabold text-slate-900 dark:text-white"><Database className="h-4 w-4 text-brand-500" /> Gérer mes données</h3>

          <ManageSection
            id="accounts" icon="bank" color="#0ea5e9" title="Comptes" count={accounts.filter((a) => !a.archived).length}
            openId={openId} setOpenId={setOpenId} onAdd={() => openAdd('account')} addLabel="Ajouter un compte"
            empty={accounts.length === 0 ? 'Aucun compte pour le moment.' : null}
          >
            {accounts.map((a) => (
              <Row
                key={a.id} icon={a.icon} color={a.color}
                title={`${a.name}${a.archived ? ' (archivé)' : ''}`}
                subtitle={ACCOUNT_TYPES.find((t) => t.id === a.type)?.label || a.type}
                right={<Money value={balances[a.id] ?? 0} className="text-sm font-extrabold text-slate-900 dark:text-white" />}
                onEdit={() => openEdit('account', a)}
                onDelete={() => setDeleting({ kind: 'account', item: a })}
              />
            ))}
          </ManageSection>

          <ManageSection
            id="categories" icon="shop" color="#8b5cf6" title="Catégories" count={categories.length}
            openId={openId} setOpenId={setOpenId} onAdd={() => openAdd('category')} addLabel="Ajouter une catégorie"
            empty={categories.length === 0 ? 'Aucune catégorie pour le moment.' : null}
          >
            <div className="px-4 pb-1 pt-2">
              <Segmented options={[{ value: 'expense', label: 'Dépenses' }, { value: 'income', label: 'Revenus' }]} value={catTab} onChange={setCatTab} />
            </div>
            {categories.filter((c) => c.type === catTab).map((c) => (
              <Row
                key={c.id} icon={c.icon} color={c.color} title={c.name}
                subtitle={`${transactions.filter((t) => t.categoryId === c.id).length} opération(s)`}
                onEdit={() => openEdit('category', c)}
                onDelete={() => setDeleting({ kind: 'category', item: c })}
              />
            ))}
          </ManageSection>

          <ManageSection
            id="budgets" icon="money" color="#f59e0b" title="Budgets mensuels" count={budgets.length}
            openId={openId} setOpenId={setOpenId} onAdd={() => openAdd('budget')} addLabel="Ajouter un budget"
            empty={budgets.length === 0 ? 'Aucun budget pour le moment.' : null}
          >
            {budgets.map((b) => {
              const cat = categoryById[b.categoryId]
              const spent = b.categoryId === 'all' ? monthExpense : spentByCat[b.categoryId] || 0
              return (
                <Row
                  key={b.id}
                  icon={b.categoryId === 'all' ? 'money' : cat?.icon || 'dots'}
                  color={b.categoryId === 'all' ? '#0d9d6c' : cat?.color || '#64748b'}
                  title={b.categoryId === 'all' ? 'Budget global' : cat?.name || 'Catégorie supprimée'}
                  subtitle={<><Money value={spent} compact /> dépensés sur <Money value={b.amount} compact /></>}
                  extra={<div className="mt-1.5"><ProgressBar value={spent} max={b.amount} color={b.categoryId === 'all' ? undefined : cat?.color} /></div>}
                  onEdit={() => openEdit('budget', b)}
                  onDelete={() => setDeleting({ kind: 'budget', item: b })}
                />
              )
            })}
          </ManageSection>

          <ManageSection
            id="goals" icon="piggy" color="#ec4899" title="Objectifs d'épargne" count={goals.length}
            openId={openId} setOpenId={setOpenId} onAdd={() => openAdd('goal')} addLabel="Ajouter un objectif"
            empty={goals.length === 0 ? 'Aucun objectif pour le moment.' : null}
          >
            {goals.map((g) => (
              <Row
                key={g.id} icon={g.icon} color={g.color} title={g.name}
                subtitle={<><Money value={g.saved} compact /> sur <Money value={g.target} compact /></>}
                extra={<div className="mt-1.5"><ProgressBar value={g.saved} max={g.target} color={g.color} /></div>}
                right={
                  <button onClick={() => setFunding(g)} className="flex items-center gap-1 rounded-xl bg-brand-500/10 px-2.5 py-1.5 text-[11px] font-bold text-brand-700 dark:text-brand-300" aria-label="Alimenter">
                    <HandCoins className="h-3.5 w-3.5" />
                  </button>
                }
                onEdit={() => openEdit('goal', g)}
                onDelete={() => setDeleting({ kind: 'goal', item: g })}
              />
            ))}
          </ManageSection>

          <ManageSection
            id="recurring" icon="phone" color="#14b8a6" title="Abonnements" count={recurring.filter((r) => r.active).length}
            openId={openId} setOpenId={setOpenId} onAdd={() => openAdd('recurring')} addLabel="Ajouter un abonnement"
            empty={recurring.length === 0 ? 'Aucun abonnement pour le moment.' : null}
          >
            {recurring.map((r) => (
              <Row
                key={r.id}
                icon={categoryById[r.categoryId]?.icon || (r.type === 'income' ? 'salary' : 'phone')}
                color={categoryById[r.categoryId]?.color || (r.type === 'income' ? '#0d9d6c' : '#64748b')}
                title={`${r.active ? '' : '⏸ '}${r.name}`}
                subtitle={`${r.frequency === 'weekly' ? 'Hebdo' : r.frequency === 'yearly' ? 'Annuel' : 'Mensuel'} · ${accountById[r.accountId]?.name || ''}`}
                right={<Money value={r.type === 'expense' ? -r.amount : r.amount} signed className="text-sm font-extrabold" />}
                onEdit={() => openEdit('recurring', r)}
                onDelete={() => setDeleting({ kind: 'recurring', item: r })}
              />
            ))}
          </ManageSection>

          {/* Opérations & vacations : accès direct */}
          <Card className="divide-y divide-slate-100 dark:divide-white/5">
            <button onClick={() => setView('transactions')} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
              <IconBadge icon="wallet" color="#0d9d6c" size="sm" />
              <span className="flex-1 text-sm font-extrabold text-slate-900 dark:text-white">Transactions</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold tabular-nums text-slate-500 dark:bg-white/10 dark:text-slate-300">{transactions.length}</span>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">Gérer →</span>
            </button>
            <button onClick={() => setView('work')} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
              <IconBadge icon="salary" color="#f97316" size="sm" />
              <span className="flex-1 text-sm font-extrabold text-slate-900 dark:text-white">Vacations de travail</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold tabular-nums text-slate-500 dark:bg-white/10 dark:text-slate-300">{shifts.length}</span>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">Gérer →</span>
            </button>
          </Card>
        </div>

        {/* ---------- Données ---------- */}
        <Card className="p-5">
          <h3 className="mb-1 flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><ShieldCheck className="h-4 w-4 text-brand-500" /> Données & sauvegarde</h3>
          <p className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            {transactions.length} opérations · {accounts.length} comptes · {shifts.length} vacations — stockées localement 🔒
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" onClick={exportJSON}><Download className="h-4 w-4" /> Exporter</Btn>
            <Btn variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Importer</Btn>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Btn variant="soft" onClick={() => setConfirmReset(true)}><RefreshCcw className="h-4 w-4" /> Données démo</Btn>
            <Btn variant="soft" onClick={() => setConfirmSettings(true)}><RotateCcw className="h-4 w-4" /> Réglages par défaut</Btn>
          </div>
          <Btn variant="danger" className="mt-2 w-full" onClick={() => setConfirmClear(true)}><Trash2 className="h-4 w-4" /> Tout effacer</Btn>
        </Card>

        <Card className="p-5">
          <h3 className="mb-2 flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><Info className="h-4 w-4 text-brand-500" /> À propos</h3>
          <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            🥜 <strong>Cashew Clone v1.0</strong> — votre compagnon pour des finances sereines.
            Suivez vos dépenses, vos budgets et vos objectifs, le tout hors-ligne et sans compte.
            Vos données ne quittent jamais votre navigateur.
          </p>
        </Card>
      </div>

      {/* Modales de gestion */}
      <AccountModal open={modal?.kind === 'account'} onClose={closeModal} editing={modal?.item || null} />
      <CategoryModal open={modal?.kind === 'category'} onClose={closeModal} editing={modal?.item || null} defaultType={catTab} />
      <BudgetModal open={modal?.kind === 'budget'} onClose={closeModal} editing={modal?.item || null} />
      <GoalModal open={modal?.kind === 'goal'} onClose={closeModal} editing={modal?.item || null} />
      <GoalFundModal open={!!funding} onClose={() => setFunding(null)} goal={funding} />
      <RecurringModal open={modal?.kind === 'recurring'} onClose={closeModal} editing={modal?.item || null} />
      <PinSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} initialLength={setupLength} onSaved={() => flash('Code PIN enregistré ✅')} />
      <PinVerifyModal
        open={!!verifyAction}
        onClose={() => setVerifyAction(null)}
        title={verifyAction === 'disable' ? 'Désactiver le verrouillage' : 'Changer le code'}
        onSuccess={() => {
          if (verifyAction === 'disable') {
            lock.disable()
            flash('Verrouillage désactivé')
          } else {
            setSetupLength(lock.length)
            setSetupOpen(true)
          }
        }}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={deleting ? DELETE_TITLE[deleting.kind] : ''}
        message={deleting ? `« ${deleting.item?.name || ''} » sera définitivement supprimé.` : ''}
        onConfirm={() => dispatch({ type: DELETE_ACTION[deleting.kind], payload: deleting.item.id })}
      />
      <ConfirmModal
        open={confirmReset} onClose={() => setConfirmReset(false)}
        title="Restaurer la démo ?" danger={false}
        message="Vos données actuelles seront remplacées par le jeu de démonstration."
        onConfirm={() => dispatch({ type: 'RESET' })}
      />
      <ConfirmModal
        open={confirmSettings} onClose={() => setConfirmSettings(false)}
        title="Réinitialiser les réglages ?" danger={false}
        message="Apparence et préférences reviendront aux valeurs par défaut. Vos données (comptes, opérations…) seront conservées."
        onConfirm={() => { dispatch({ type: 'RESET_SETTINGS' }); flash('Réglages réinitialisés ✅') }}
      />
      <ConfirmModal
        open={confirmClear} onClose={() => setConfirmClear(false)}
        title="Tout effacer ?"
        message="Toutes vos données (comptes, opérations, budgets…) seront définitivement supprimées. Pensez à exporter avant !"
        onConfirm={() => { dispatch({ type: 'CLEAR_ALL' }); lock.clear() }}
      />
    </div>
  )
}
