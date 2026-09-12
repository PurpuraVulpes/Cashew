import React, { useEffect, useState } from 'react'
import { Delete, LockKeyhole } from 'lucide-react'
import { Modal, Btn, Segmented } from './ui.jsx'
import { useLock } from '../context/LockContext.jsx'
import { useFinance } from '../context/FinanceContext.jsx'
import { cx, greeting } from '../utils/helpers.js'

const KEYS = [
  { d: '1', sub: '' }, { d: '2', sub: 'ABC' }, { d: '3', sub: 'DEF' },
  { d: '4', sub: 'GHI' }, { d: '5', sub: 'JKL' }, { d: '6', sub: 'MNO' },
  { d: '7', sub: 'PQRS' }, { d: '8', sub: 'TUV' }, { d: '9', sub: 'WXYZ' },
]

export function PinDots({ length, filled, error, tone = 'dark' }) {
  const dot = (active) => {
    if (tone === 'dark') {
      return active
        ? 'scale-110 bg-white shadow-[0_0_12px_rgba(255,255,255,.7)]'
        : error ? 'bg-rose-400/70' : 'bg-white/25'
    }
    return active
      ? 'scale-110 bg-slate-900 dark:bg-white'
      : error ? 'bg-rose-400' : 'bg-slate-200 dark:bg-white/20'
  }
  return (
    <div className="flex justify-center gap-3.5">
      {Array.from({ length }).map((_, i) => (
        <span key={i} className={cx('h-3.5 w-3.5 rounded-full transition-all duration-150', dot(i < filled))} />
      ))}
    </div>
  )
}

export function Keypad({ onDigit, onDelete, dark = true, disabled = false }) {
  const btn = cx(
    'flex h-[4.25rem] w-[4.25rem] flex-col items-center justify-center rounded-full text-2xl font-bold transition active:scale-90',
    dark
      ? 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
    disabled && 'pointer-events-none opacity-40'
  )
  return (
    <div className="mx-auto grid max-w-[19rem] grid-cols-3 place-items-center gap-x-4 gap-y-3">
      {KEYS.map((k) => (
        <button key={k.d} onClick={() => onDigit(k.d)} className={btn} aria-label={`Chiffre ${k.d}`}>
          {k.d}
          <span className="h-3 text-[9px] font-extrabold tracking-[0.2em] opacity-60">{k.sub}</span>
        </button>
      ))}
      <span />
      <button onClick={() => onDigit('0')} className={btn} aria-label="Chiffre 0">
        0
        <span className="h-3" />
      </button>
      <button onClick={onDelete} className={btn} aria-label="Effacer">
        <Delete className="h-6 w-6" />
        <span className="h-3" />
      </button>
    </div>
  )
}

/* ---------- Écran de verrouillage plein écran ---------- */
export function LockScreen() {
  const lock = useLock()
  const { settings, dispatch } = useFinance()
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [checking, setChecking] = useState(false)
  const [clock, setClock] = useState(() => new Date())
  const [armErase, setArmErase] = useState(false)

  useEffect(() => {
    const i = setInterval(() => setClock(new Date()), 5000)
    return () => clearInterval(i)
  }, [])

  // Clavier physique
  useEffect(() => {
    const fn = (e) => {
      if (lock.blockLeft > 0 || checking) return
      if (/^[0-9]$/.test(e.key)) {
        setError(false)
        setDigits((prev) => (prev.length < lock.length ? prev + e.key : prev))
      } else if (e.key === 'Backspace') {
        setDigits((prev) => prev.slice(0, -1))
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lock.blockLeft, checking, lock.length, digits])

  const addDigit = (d) => {
    setError(false)
    setDigits((prev) => (prev.length < lock.length ? prev + d : prev))
  }

  // Vérification automatique une fois le code complet
  useEffect(() => {
    if (digits.length !== lock.length || checking || lock.blockLeft > 0) return
    setChecking(true)
    const t = setTimeout(async () => {
      const ok = await lock.unlock(digits)
      try {
        navigator.vibrate?.(ok ? 15 : [30, 50, 30])
      } catch { /* ignore */ }
      setChecking(false)
      if (!ok) {
        setError(true)
        setShakeKey((k) => k + 1)
        setTimeout(() => {
          setDigits('')
          setError(false)
        }, 500)
      } else {
        setDigits('')
      }
    }, 220)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  const eraseAll = () => {
    dispatch({ type: 'CLEAR_ALL' })
    lock.clear()
  }

  const blocked = lock.blockLeft > 0
  const hh = String(clock.getHours()).padStart(2, '0')
  const mm = String(clock.getMinutes()).padStart(2, '0')
  const dateStr = clock.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0a0f0d] text-white">
      <div className="pointer-events-none fixed -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/25 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-40 -left-24 h-80 w-80 rounded-full bg-brand-600/20 blur-[100px]" />
      <div className="relative mx-auto flex min-h-full w-full max-w-sm flex-col items-center px-8 py-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-brand-400 to-brand-700 text-4xl shadow-2xl shadow-brand-500/30 ring-1 ring-white/20">
          🥜
        </span>
        <p className="mt-5 text-6xl font-extrabold tabular-nums tracking-tight">{hh}:{mm}</p>
        <p className="mt-1 text-sm font-semibold capitalize text-white/60">{dateStr}</p>

        <p className="mt-6 text-sm font-semibold text-white/70">{greeting()}, {settings.name || 'ami'} 👋</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-white/50">
          <LockKeyhole className="h-3.5 w-3.5" /> Entrez votre code à {lock.length} chiffres
        </p>

        <div key={shakeKey} className={cx('mt-5', error && 'anim-shake')}>
          <PinDots length={lock.length} filled={digits.length} error={error} />
        </div>
        <p className="mt-3 h-5 text-center text-xs font-bold text-rose-400">
          {blocked
            ? `Trop de tentatives — réessayez dans ${lock.blockLeft}s`
            : error
              ? 'Code incorrect, réessayez'
              : lock.fails > 0
                ? `Tentative ${lock.fails}/${lock.maxFails}`
                : ''}
        </p>

        <div className="mt-1 w-full">
          <Keypad onDigit={addDigit} onDelete={() => setDigits((d) => d.slice(0, -1))} disabled={blocked || checking} />
        </div>

        <div className="mt-auto w-full pt-8 text-center">
          {!armErase ? (
            <button onClick={() => setArmErase(true)} className="text-xs font-bold text-white/40 transition hover:text-white/70">
              Code oublié ?
            </button>
          ) : (
            <div className="anim-pop rounded-3xl bg-rose-500/10 p-4 ring-1 ring-rose-500/30">
              <p className="text-xs font-bold leading-relaxed text-rose-200">
                Impossible de récupérer un code oublié.<br />Effacer toutes les données pour déverrouiller ?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setArmErase(false)} className="rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95">
                  Annuler
                </button>
                <button onClick={eraseAll} className="rounded-2xl bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95">
                  Tout effacer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Création / modification du code ---------- */
export function PinSetupModal({ open, onClose, initialLength = 4, onSaved }) {
  const lock = useLock()
  const [length, setLength] = useState(initialLength)
  const [step, setStep] = useState('enter')
  const [first, setFirst] = useState('')
  const [digits, setDigits] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLength(initialLength)
    setStep('enter')
    setFirst('')
    setDigits('')
    setError('')
    setSaving(false)
  }, [open, initialLength])

  const addDigit = (d) => {
    if (saving) return
    if (digits.length >= length) return
    setError('')
    const next = digits + d
    setDigits(next)
    if (next.length === length) {
      if (step === 'enter') {
        setTimeout(() => {
          setFirst(next)
          setDigits('')
          setStep('confirm')
        }, 200)
      } else if (next === first) {
        setSaving(true)
        setTimeout(async () => {
          await lock.setPin(next, length)
          onSaved?.()
          onClose()
        }, 200)
      } else {
        setTimeout(() => {
          setError('Les codes ne correspondent pas, recommencez')
          setDigits('')
        }, 200)
      }
    }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title={step === 'enter' ? 'Choisissez votre code' : 'Confirmez votre code'}
      subtitle={step === 'enter' ? `Un code à ${length} chiffres protègera l'application` : 'Saisissez-le une seconde fois'}
    >
      <div className="space-y-5">
        {step === 'enter' && (
          <Segmented
            options={[{ value: 4, label: '4 chiffres' }, { value: 6, label: '6 chiffres' }]}
            value={length}
            onChange={(v) => { setLength(v); setDigits(''); setError('') }}
          />
        )}
        <PinDots length={length} filled={digits.length} error={!!error} tone="light" />
        {error && <p className="text-center text-xs font-bold text-rose-500">{error}</p>}
        <Keypad dark={false} onDigit={addDigit} onDelete={() => setDigits((d) => d.slice(0, -1))} disabled={saving} />
        <Btn variant="ghost" className="w-full" onClick={onClose}>Annuler</Btn>
      </div>
    </Modal>
  )
}

/* ---------- Vérification du code actuel ---------- */
export function PinVerifyModal({ open, onClose, title = 'Confirmez votre code', onSuccess }) {
  const lock = useLock()
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!open) return
    setDigits('')
    setError(false)
    setChecking(false)
  }, [open ])

  const addDigit = (d) => {
    if (checking || digits.length >= lock.length) return
    setError(false)
    const next = digits + d
    setDigits(next)
    if (next.length === lock.length) {
      setChecking(true)
      setTimeout(async () => {
        const ok = await lock.verify(next)
        setChecking(false)
        if (ok) {
          setDigits('')
          onSuccess?.()
          onClose()
        } else {
          setError(true)
          setTimeout(() => setDigits(''), 350)
        }
      }, 200)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle="Saisissez votre code actuel pour continuer">
      <div className="space-y-5">
        <PinDots length={lock.length} filled={digits.length} error={error} tone="light" />
        {error && <p className="text-center text-xs font-bold text-rose-500">Code incorrect</p>}
        <Keypad dark={false} onDigit={addDigit} onDelete={() => setDigits((d) => d.slice(0, -1))} disabled={checking} />
        <Btn variant="ghost" className="w-full" onClick={onClose}>Annuler</Btn>
      </div>
    </Modal>
  )
}
