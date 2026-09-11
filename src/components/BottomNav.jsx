import { Home, Wallet, PieChart, MoreHorizontal } from 'lucide-react'

const TABS = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: Wallet },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'more', label: 'Plus', icon: MoreHorizontal },
]

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => {
        const Icon = t.icon
        const active = tab === t.id
        return (
          <button
            key={t.id}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon-wrap">
              <Icon size={23} strokeWidth={active ? 2.6 : 2.1} />
            </span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
