import { Repeat } from 'lucide-react'
import { categoryById } from '../data.js'
import { fmtMoney, fmtSigned } from '../utils.js'

export default function TxRow({ tx, account, currency, onClick, showAccount }) {
  const cat = categoryById(tx.categoryId)
  return (
    <button className="tx-row" onClick={() => onClick?.(tx)}>
      <span className="tx-icon" style={{ '--c': cat.color }}>
        {cat.emoji}
      </span>
      <span className="tx-main">
        <span className="tx-name" style={{ display: 'block' }}>
          {tx.name || cat.label}
        </span>
        <span className="tx-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {cat.label}
          {showAccount && account ? ` · ${account.emoji} ${account.name}` : null}
          {tx.recurring ? (
            <Repeat size={11} style={{ marginLeft: 2 }} aria-label="Récurrent" />
          ) : null}
        </span>
      </span>
      <span className={`tx-amount ${tx.type}`}>{fmtSigned(tx.amount, currency, tx.type)}</span>
    </button>
  )
}
