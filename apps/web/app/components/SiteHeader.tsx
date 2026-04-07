'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export function SiteHeader({ appUrl }: { appUrl: string }) {
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop]   = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setAtTop(y < 12)
      if (y > lastY.current && y > 80) setHidden(true)
      else if (y < lastY.current)       setHidden(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     50,
        transform:  hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.3s ease, background 0.2s ease, box-shadow 0.2s ease',
        background: atTop ? 'transparent' : 'rgba(255,255,255,0.97)',
        backdropFilter: atTop ? 'none' : 'blur(8px)',
        boxShadow:  atTop ? 'none' : '0 1px 0 0 rgba(15,23,42,0.08)',
      }}
    >
      <nav
        style={{
          maxWidth:      '1200px',
          margin:        '0 auto',
          padding:       '0 24px',
          height:        '64px',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          gap:           '24px',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" fill="white" opacity="0.9"/>
              <rect x="5" y="5" width="6" height="6" rx="1" fill="white"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#0F172A', letterSpacing: '-0.3px' }}>
            StockPro
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'center' }}
             className="nav-links">
          {[
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Preços',           href: '#pricing'  },
            { label: 'FAQ',              href: '#faq'      },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                fontSize:       '14px',
                fontWeight:     500,
                color:          '#475569',
                textDecoration: 'none',
                transition:     'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href={`${appUrl}/login`}
            style={{
              fontSize:       '14px',
              fontWeight:     500,
              color:          '#475569',
              textDecoration: 'none',
              padding:        '8px 16px',
              borderRadius:   '8px',
              transition:     'color 0.15s',
            }}
          >
            Login
          </Link>
          <Link
            href={`${appUrl}/register`}
            style={{
              fontSize:       '14px',
              fontWeight:     600,
              color:          '#fff',
              textDecoration: 'none',
              padding:        '8px 18px',
              borderRadius:   '8px',
              background:     '#2563EB',
              transition:     'background 0.15s',
              whiteSpace:     'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1D4ED8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2563EB')}
          >
            Começar grátis
          </Link>
        </div>
      </nav>
    </header>
  )
}
