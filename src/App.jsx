import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { StoreProvider, useStore } from './store.jsx'
import { UIProvider, SheetHost, useUI } from './ui.jsx'
import { STYLES, paletteForAccent } from './data.js'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'
import Transactions from './pages/Transactions.jsx'
import Budgets from './pages/Budgets.jsx'
import More from './pages/More.jsx'

function applyTheme(settings) {
  const root = document.documentElement
  let mode = settings.theme
  if (mode === 'system') {
    mode = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  root.dataset.theme = mode

  // Teinte de fond
  const styleVars = STYLES[settings.style]?.[mode] || STYLES.default[mode]
  const varMap = {
    bg: '--bg',
    elevated: '--bg-elevated',
    surface: '--surface',
    surface2: '--surface-2',
    surface3: '--surface-3',
  }
  for (const [key, cssVar] of Object.entries(varMap)) {
    root.style.setProperty(cssVar, styleVars[key])
  }

  // Couleur d'accent (préréglage ou hex personnalisé)
  const palette = paletteForAccent(settings.accent, mode)
  root.style.setProperty('--accent', palette.accent)
  root.style.setProperty('--accent-soft', palette.soft)
  root.style.setProperty('--on-accent', palette.on)
  root.style.setProperty('--grad-from', palette.grad[0])
  root.style.setProperty('--grad-to', palette.grad[1])

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', styleVars.bg)
}

function Shell() {
  return (
    <UIProvider>
      <ShellContent />
    </UIProvider>
  )
}

function ShellContent() {
  const { state } = useStore()
  const { open } = useUI()
  const [tab, setTab] = useState('home')

  useEffect(() => {
    applyTheme(state.settings)
  }, [state.settings])

  useEffect(() => {
    if (state.settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyTheme(state.settings)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [state.settings])

  const pages = {
    home: <Home onNavigate={setTab} />,
    transactions: <Transactions />,
    budgets: <Budgets />,
    more: <More />,
  }

  return (
    <div className="app-shell">
      <main className="page" key={tab}>
        {pages[tab]}
      </main>

      <button
        className="fab"
        onClick={() => open('transaction')}
        aria-label="Ajouter une transaction"
      >
        <Plus size={32} strokeWidth={2.8} />
      </button>

      <BottomNav tab={tab} onChange={setTab} />
      <SheetHost />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
