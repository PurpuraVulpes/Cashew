import React, { useEffect } from 'react'
import {
  ShoppingCart, UtensilsCrossed, Coffee, Car, Home, Zap, HeartPulse, PartyPopper,
  Plane, ShoppingBag, Gift, BookOpen, Dumbbell, PawPrint, Smartphone, Bus, Baby,
  Shirt, Sparkles, Landmark, Briefcase, TrendingUp, Ellipsis, PiggyBank, Banknote,
  CreditCard, Wallet, CircleDollarSign,
} from 'lucide-react'
import { cx, formatMoney } from '../utils/helpers.js'
import { useFinance } from '../context/FinanceContext.jsx'

export const ICONS = {
  cart: ShoppingCart, food: UtensilsCrossed, coffee: Coffee, car: Car, home: Home,
  bolt: Zap, health: HeartPulse, fun: PartyPopper, plane: Plane, shop: ShoppingBag,
  gift: Gift, book: BookOpen, sport: Dumbbell, pet: PawPrint, phone: Smartphone,
  bus: Bus, baby: Baby, shirt: Shirt, beauty: Sparkles, bank: Landmark,
  salary: Briefcase, chart: TrendingUp, dots: Ellipsis, piggy: PiggyBank,
  cash: Banknote, card: CreditCard, wallet: Wallet, money: CircleDollarSign,
}

export function IconBadge({ icon = 'dots', color, size = 'md', soft = true }) {
  const { brand500 } = useFinance()
  const c = color || brand500
  const Cmp = ICONS[icon] || Ellipsis
  const sizes = {
    xs: 'h-7 w-7 rounded-lg [&>svg]:h-3.5 [&>svg]:w-3.5',
    sm: 'h-9 w-9 rounded-xl [&>svg]:h-4.5 [&>svg]:w-4.5',
    md: 'h-11 w-11 rounded-2xl [&>svg]:h-5 [&>svg]:w-5',
    lg: 'h-14 w-14 rounded-2xl [&>svg]:h-7 [&>svg]:w-7',
  }
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center shadow-[0_1px_3px_rgba(15,23,42,0.08)]', sizes[size])}
      style={soft ? { backgroundColor: c + '1f', color: c } : { backgroundColor: c, color: '#fff' }}
    >
      <Cmp />
    </span>
  )
}

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cx('rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-shadow dark:border-white/10 dark:bg-[#131a17] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function Money({ value, currency, className, compact, signed, positiveGood = true }) {
  const { settings } = useFinance()
  const cur = currency || settings.currency
  const v = Number(value) || 0
  const color = signed
    ? v > 0
      ? positiveGood ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'
      : v < 0 ? 'text-rose-500' : ''
    : ''
  return (
    <span className={cx('tabular-nums', color, className)}>
      {signed && v > 0 ? '+' : ''}{formatMoney(value, cur, compact ? { compact: true } : {})}
    </span>
  )
}

export function ProgressBar({ value, max, color, className, trackClassName }) {
  const { brand500 } = useFinance()
  const c = color || brand500
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const over = max > 0 && value > max
  const fill = over ? '#f43f5e' : c
  return (
    <div className={cx('h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.07)] dark:bg-white/10', trackClassName)}>
      <div
        className={cx('h-full rounded-full transition-all duration-700', className)}
        style={{
          width: `${over ? 100 : pct}%`,
          backgroundColor: fill,
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,0) 55%)',
          boxShadow: `0 2px 10px ${fill}55`,
        }}
      />
    </div>
  )
}

export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cx('flex rounded-2xl bg-slate-100 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] dark:bg-white/10', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-[.98]',
            value === o.value
              ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.1)] dark:bg-white/15 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, wide }) {
  useEffect(() => {
    if (!open) return
    const fn = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', fn)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="anim-fade absolute inset-0 bg-slate-950/55 backdrop-blur-md" onClick={onClose} />
      <div
        className={cx(
          'anim-pop relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-8 shadow-2xl ring-1 ring-slate-900/5 dark:bg-[#141b18] dark:ring-white/10 sm:rounded-[1.75rem] sm:p-6',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/15 sm:hidden" />
        {(title) && (
          <div className="mb-5">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>}
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20 dark:focus:bg-white/10'

export function Btn({ variant = 'primary', className, ...props }) {
  const styles = {
    primary: 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 hover:brightness-105 active:scale-[.97]',
    soft: 'bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 active:scale-[.98] dark:text-brand-300',
    secondary: 'bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200 active:scale-[.98] dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:shadow-none',
    danger: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 active:scale-[.98] dark:text-rose-400',
    solidDanger: 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 hover:brightness-105 active:scale-[.97]',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-[.98] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white',
  }
  return (
    <button
      className={cx('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition', styles[variant], className)}
      {...props}
    />
  )
}

export function EmptyState({ icon = 'dots', title, hint, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <IconBadge icon={icon} size="lg" />
      <p className="mt-4 font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Avatar({ name, className }) {
  const initials = (name || 'U').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span className={cx('inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-extrabold text-white shadow-md ring-2 ring-white/80 dark:ring-white/10', className)}>
      {initials}
    </span>
  )
}
