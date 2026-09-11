import { useRef, useState } from 'react'
import {
  Palette,
  Droplet,
  Moon,
  Coins,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  ChevronRight,
  Github,
  ShieldCheck,
} from 'lucide-react'
import { useStore } from '../store.jsx'
import { ACCENTS, STYLES, CURRENCIES, categoryById, paletteForAccent } from '../data.js'
import { download, fmtMoney } from '../utils.js'

function GroupTitle({ children }) {
  return <div className="settings-group-title">{children}</div>
}

export default function More() {
  const { state, dispatch } = useStore()
  const { settings, transactions, accounts, budgets } = state
  const fileRef = useRef(null)

  const setTheme = (theme) => dispatch({ type: 'settings', patch: { theme } })
  const setAccent = (accent) => dispatch({ type: 'settings', patch: { accent } })
  const setStyle = (style) => dispatch({ type: 'settings', patch: { style } })
  const setCurrency = (currency) => dispatch({ type: 'settings', patch: { currency } })
  const [customColor, setCustomColor] = useState(
    settings.accent?.[0] === '#' ? settings.accent : '#3aa86a',
  )
  const isCustom = settings.accent?.[0] === '#'

  const exportCSV = () => {
    const rows = [['Date', 'Type', 'Compte', 'Catégorie', 'Nom', 'Montant']]
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
    for (const t of sorted) {
      rows.push([
        t.date,
        t.type === 'income' ? 'Revenu' : 'Dépense',
        accounts.find((a) => a.id === t.accountId)?.name || '',
        categoryById(t.categoryId).label,
        (t.name || '').replace(/;/g, ','),
        String(t.type === 'income' ? t.amount : -t.amount).replace('.', ','),
      ])
    }
    const csv = '\uFEFF' + rows.map((r) => r.join(';')).join('\n')
    download(`cashew-export-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
  }

  const exportBackup = () => {
    download(
      `cashew-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(state, null, 2),
    )
  }

  const importBackup = async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.transactions || !data.accounts) throw new Error('Format invalide')
      dispatch({ type: 'import', state: data })
      alert('Sauvegarde restaurée avec succès.')
    } catch {
      alert("Le fichier sélectionné n'est pas une sauvegarde valide.")
    }
  }

  const reset = () => {
    if (confirm('Réinitialiser toutes les données et retrouver les données de démonstration ?')) {
      dispatch({ type: 'reset' })
    }
  }

  const expenseCount = transactions.filter((t) => t.type === 'expense').length
  const mode =
    settings.theme === 'system'
      ? typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : settings.theme

  return (
    <>
      <header className="page-header">
        <h1 className="header-title">Réglages</h1>
      </header>

      <GroupTitle>Apparence</GroupTitle>
      <div className="settings-group">
        <div style={{ padding: '15px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="settings-icon">
              <Moon size={19} />
            </span>
            <span className="settings-row-label">Thème</span>
          </div>
          <div className="segmented" style={{ marginTop: 12 }}>
            <button className={settings.theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
              Clair
            </button>
            <button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
              Sombre
            </button>
            <button className={settings.theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}>
              Auto
            </button>
          </div>
        </div>
        <div style={{ padding: '6px 16px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="settings-icon">
              <Palette size={19} />
            </span>
            <span className="settings-row-label">Couleur d'accent</span>
          </div>
          <div className="accent-row" style={{ paddingLeft: 52 }}>
            {Object.entries(ACCENTS).map(([id, a]) => {
              const c = paletteForAccent(id, mode).accent
              return (
                <button
                  key={id}
                  className={`accent-dot ${settings.accent === id ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAccent(id)}
                  aria-label={a.label}
                  title={a.label}
                />
              )
            })}
            <label
              className={`accent-dot custom ${isCustom ? 'selected' : ''}`}
              style={{
                background: isCustom
                  ? paletteForAccent(customColor, mode).accent
                  : 'conic-gradient(#ff6b6b, #ffd93d, #6bcb77, #4d96ff, #b983ff, #ff6b6b)',
              }}
              title="Couleur personnalisée"
              aria-label="Couleur personnalisée"
            >
              <input
                type="color"
                value={isCustom ? settings.accent : customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  setAccent(e.target.value)
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                }}
              />
            </label>
          </div>
        </div>

        <div style={{ padding: '10px 16px 15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="settings-icon">
              <Droplet size={19} />
            </span>
            <span className="settings-row-label">Teinte de fond</span>
          </div>
          <div className="style-row">
            {Object.entries(STYLES).map(([id, st]) => {
              const vars = st[mode]
              const active = (settings.style || 'default') === id
              return (
                <button
                  key={id}
                  className={`style-chip ${active ? 'active' : ''}`}
                  onClick={() => setStyle(id)}
                >
                  <span
                    className="style-mini"
                    style={{ background: vars.bg }}
                    aria-hidden="true"
                  >
                    <i style={{ background: vars.surface2 }} />
                  </span>
                  {st.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <GroupTitle>Préférences</GroupTitle>
      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-icon">
            <Coins size={19} />
          </span>
          <span className="settings-row-main settings-row-label">Devise</span>
          <select
            className="select-input"
            style={{ width: 150, padding: '10px 12px' }}
            value={settings.currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <GroupTitle>Mes données</GroupTitle>
      <div className="settings-group">
        <button className="settings-row" onClick={exportCSV}>
          <span className="settings-icon">
            <FileSpreadsheet size={19} />
          </span>
          <span className="settings-row-main">
            <div className="settings-row-label">Exporter en CSV</div>
            <div className="settings-row-sub">Compatible Excel</div>
          </span>
          <ChevronRight size={18} color="var(--text-faint)" />
        </button>
        <button className="settings-row" onClick={exportBackup}>
          <span className="settings-icon">
            <Download size={19} />
          </span>
          <span className="settings-row-main">
            <div className="settings-row-label">Sauvegarder</div>
            <div className="settings-row-sub">Fichier JSON complet</div>
          </span>
          <ChevronRight size={18} color="var(--text-faint)" />
        </button>
        <button className="settings-row" onClick={() => fileRef.current?.click()}>
          <span className="settings-icon">
            <Upload size={19} />
          </span>
          <span className="settings-row-main">
            <div className="settings-row-label">Restaurer une sauvegarde</div>
            <div className="settings-row-sub">Remplace les données actuelles</div>
          </span>
          <ChevronRight size={18} color="var(--text-faint)" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])}
        />
        <button className="settings-row" onClick={reset}>
          <span className="settings-icon" style={{ background: 'color-mix(in srgb, var(--down) 15%, transparent)', color: 'var(--down)' }}>
            <RotateCcw size={19} />
          </span>
          <span className="settings-row-main">
            <div className="settings-row-label">Réinitialiser</div>
            <div className="settings-row-sub">Retrouver les données de démonstration</div>
          </span>
          <ChevronRight size={18} color="var(--text-faint)" />
        </button>
      </div>

      <GroupTitle>Confidentialité</GroupTitle>
      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-icon">
            <ShieldCheck size={19} />
          </span>
          <span className="settings-row-main">
            <div className="settings-row-label">100 % locale</div>
            <div className="settings-row-sub">
              Vos {transactions.length} transactions restent sur cet appareil
            </div>
          </span>
        </div>
      </div>

      <div className="card about-card">
        <img src="/icon.svg" alt="" className="about-logo" />
        <div className="about-title">Cashew</div>
        <div className="about-version">Version 1.0.0 · suivi budgétaire</div>
        <p className="about-text">
          Une application de budgétisation inspirée de Cashew — suivez vos comptes, créez des
          budgets flexibles et comprenez où va votre argent. Les données sont stockées
          localement, aucun compte requis.
        </p>
        <p className="about-text">
          <Github size={14} style={{ verticalAlign: -2 }} /> Solde total de vos comptes :{' '}
          {fmtMoney(
            accounts.reduce(
              (s, a) =>
                s +
                (a.includeInTotal !== false
                  ? (a.initialBalance ?? 0) +
                    transactions
                      .filter((t) => t.accountId === a.id)
                      .reduce((x, t) => x + (t.type === 'income' ? t.amount : -t.amount), 0)
                  : 0),
              0,
            ),
            settings.currency,
          )}{' '}
          · {expenseCount} dépenses enregistrées
        </p>
      </div>
    </>
  )
}
