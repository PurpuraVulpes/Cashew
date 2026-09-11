import { X } from 'lucide-react'

export default function Sheet({ title, onClose, children, headerRight }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div style={{ width: 40 }} />
          <div className="sheet-title">{title}</div>
          <div className="form-row-control">
            {headerRight}
            <button className="icon-btn" onClick={onClose} aria-label="Fermer">
              <X size={22} />
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}
