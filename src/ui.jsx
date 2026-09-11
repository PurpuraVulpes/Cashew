import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { uid } from './utils.js'
import TransactionSheet from './sheets/TransactionSheet.jsx'
import AccountSheet from './sheets/AccountSheet.jsx'
import BudgetSheet from './sheets/BudgetSheet.jsx'

const UICtx = createContext(null)

const SHEETS = {
  transaction: TransactionSheet,
  account: AccountSheet,
  budget: BudgetSheet,
}

export function UIProvider({ children }) {
  const [stack, setStack] = useState([])

  const open = useCallback((name, props = {}) => {
    setStack((s) => [...s, { name, props, key: uid() }])
  }, [])
  const close = useCallback(() => setStack((s) => s.slice(0, -1)), [])

  const value = useMemo(() => ({ open, close, stack }), [open, close, stack])
  return <UICtx.Provider value={value}>{children}</UICtx.Provider>
}

export function SheetHost() {
  const { stack, close } = useContext(UICtx)
  const current = stack[stack.length - 1]
  if (!current) return null
  const CurrentSheet = SHEETS[current.name]
  if (!CurrentSheet) return null
  return <CurrentSheet key={current.key} {...current.props} onClose={close} />
}

export function useUI() {
  const ctx = useContext(UICtx)
  if (!ctx) throw new Error('useUI doit être utilisé dans UIProvider')
  return ctx
}
