import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { FinanceProvider } from './context/FinanceContext.jsx'
import { LockProvider } from './context/LockContext.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('Cashew crash:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f3f5f3', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 560, width: '100%', background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 12px 40px rgba(0,0,0,.12)' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Oups — l'app a rencontré une erreur</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
              L'écran blanc vient d'une erreur JavaScript. Voici le détail pour la corriger :
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f1f5f9', borderRadius: 12, padding: 12, fontSize: 12, color: '#0f172a', maxHeight: 260, overflow: 'auto' }}>
              {String(this.state.error?.message || this.state.error)}
              {'\n\n'}
              {String(this.state.error?.stack || '')}
            </pre>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('cashew-clone-v1')
                    localStorage.removeItem('cashew-theme-vars')
                    localStorage.removeItem('cashew-lock-v1')
                  } catch {}
                  location.reload()
                }}
                style={{ flex: 1, background: '#0b845c', color: 'white', borderRadius: 12, padding: '12px 16px', fontWeight: 700, border: 0, cursor: 'pointer' }}
              >
                Réinitialiser & recharger
              </button>
              <button
                onClick={() => location.reload()}
                style={{ flex: 1, background: '#f1f5f9', color: '#0f172a', borderRadius: 12, padding: '12px 16px', fontWeight: 700, border: 0, cursor: 'pointer' }}
              >
                Recharger
              </button>
            </div>
            <p style={{ marginTop: 12, fontSize: 11, color: '#94a3b8' }}>
              Astuce : ouvre la console (F12) pour voir l'erreur complète. Si le problème persiste, vide le cache du service worker dans DevTools → Application → Storage.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FinanceProvider>
        <LockProvider>
          <App />
        </LockProvider>
      </FinanceProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

// PWA : active le hors-ligne via le service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
