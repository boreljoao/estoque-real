'use client'

export function OpenMovementButton({ className, label }: { className?: string; label?: string }) {
  return (
    <button
      className={className ?? 'dash-btn dash-btn-primary'}
      onClick={() => window.dispatchEvent(new CustomEvent('open-quick-movement'))}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {label ?? 'Nova Movimentação'}
    </button>
  )
}
