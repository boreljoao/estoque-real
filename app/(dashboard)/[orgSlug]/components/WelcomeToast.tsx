'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function WelcomeToast() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (searchParams.get('welcome') !== '1') return
    setVisible(true)

    // Remove ?welcome=1 from URL without a page reload
    const params = new URLSearchParams(searchParams.toString())
    params.delete('welcome')
    const newUrl = pathname + (params.size > 0 ? '?' + params.toString() : '')
    router.replace(newUrl, { scroll: false })

    // Auto-dismiss after 5s
    const t = setTimeout(() => dismiss(), 5000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    setLeaving(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position:   'fixed',
        bottom:     '24px',
        right:      '24px',
        zIndex:     200,
        maxWidth:   '360px',
        width:      'calc(100vw - 48px)',
        background: '#0F172A',
        color:      '#F8FAFC',
        borderRadius:'14px',
        padding:    '16px 20px',
        boxShadow:  '0 8px 32px rgba(0,0,0,0.25)',
        display:    'flex',
        alignItems: 'flex-start',
        gap:        '12px',
        border:     '1px solid rgba(255,255,255,0.1)',
        transform:  leaving ? 'translateY(80px)' : 'translateY(0)',
        opacity:    leaving ? 0 : 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        animation:  leaving ? 'none' : 'slideUpToast 0.3s ease',
      }}
    >
      <style>{`
        @keyframes slideUpToast {
          from { transform: translateY(80px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Icon */}
      <div style={{
        width:          '36px',
        height:         '36px',
        borderRadius:   '10px',
        background:     'rgba(37,99,235,0.3)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        fontSize:       '18px',
      }}>
        🎉
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
          Bem-vindo ao StockPro!
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
          Sua empresa foi criada com sucesso. Explore o dashboard e adicione seus produtos.
        </p>
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        style={{
          background: 'none',
          border:     'none',
          color:      '#475569',
          cursor:     'pointer',
          padding:    '2px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
