import { X } from 'lucide-react'

export default function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[var(--tx)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bd)] rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-[var(--tx)]">
          {children}
        </div>
      </div>
    </div>
  )
}
