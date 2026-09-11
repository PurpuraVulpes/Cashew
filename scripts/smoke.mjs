// Test de fumée : rendu SSR de toutes les pages + vérifications métier
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StoreProvider } from '../src/store.jsx'
import { UIProvider } from '../src/ui.jsx'
import Home from '../src/pages/Home.jsx'
import Transactions from '../src/pages/Transactions.jsx'
import Budgets from '../src/pages/Budgets.jsx'
import More from '../src/pages/More.jsx'
import { buildSeedState } from '../src/seed.js'
import {
  materializeHelper,
  totalsForMonth,
} from './seed-checks.js'

const pages = { Home, Transactions, Budgets, More }

function render(Page) {
  return renderToString(
    <StoreProvider>
      <UIProvider>
        <Page onNavigate={() => {}} />
      </UIProvider>
    </StoreProvider>,
  )
}

let failures = 0
for (const [name, Page] of Object.entries(pages)) {
  try {
    const html = render(Page)
    if (html.length < 200) throw new Error('Rendu trop court')
    console.log(`✓ ${name} rendu (${html.length} caractères)`)
  } catch (e) {
    failures++
    console.error(`✗ ${name} :`, e.message)
  }
}

// Vérifications données
const raw = buildSeedState()
const state = materializeHelper(raw)
const t = totalsForMonth(state)
console.log(`✓ ${state.transactions.length} transactions après récurrence`)
console.log(`  mois en cours : dépenses ${t.out.toFixed(2)} €, revenus ${t.in.toFixed(2)} €`)
if (state.transactions.length < 50) {
  failures++
  console.error('✗ Trop peu de transactions')
}
if (t.out < 1000) {
  failures++
  console.error('✗ Dépenses du mois improbables')
}
process.exit(failures ? 1 : 0)
