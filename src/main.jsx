import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { FinanceProvider } from './context/FinanceContext.jsx'
import { LockProvider } from './context/LockContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FinanceProvider>
      <LockProvider>
        <App />
      </LockProvider>
    </FinanceProvider>
  </React.StrictMode>
)

// PWA : active le hors-ligne via le service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
