'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Dashboard Mockup (pure CSS/JSX) ─────────────────────────────────────────

const BARS = [38,55,42,70,50,65,82,44,58,73,48,80,68,90,60,76,52,68,80,57,72,85,62,77,68,82,57,72,88,75]

function DashboardMockup() {
  return (
    <div style={{
      borderRadius: '16px',
      overflow:     'hidden',
      boxShadow:    '0 32px 80px rgba(0,0,0,0.45)',
      border:       '1px solid rgba(255,255,255,0.08)',
      background:   '#0F172A',
      userSelect:   'none',
    }}>
      {/* Browser chrome */}
      <div style={{
        background:  '#1E293B',
        padding:     '10px 16px',
        display:     'flex',
        alignItems:  'center',
        gap:         '6px',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
      }}>
        {['#F87171','#FBBF24','#34D399'].map((c) => (
          <div key={c} style={{ width:11, height:11, borderRadius:'50%', background:c }} />
        ))}
        <div style={{
          marginLeft:    '12px',
          flex:          1,
          background:    'rgba(0,0,0,0.25)',
          borderRadius:  '6px',
          padding:       '4px 12px',
          fontSize:      '11px',
          color:         '#475569',
          fontFamily:    'var(--font-mono)',
        }}>
          app.stockpro.com.br/dashboard
        </div>
      </div>

      {/* Dashboard body */}
      <div style={{ display: 'flex', height: '380px' }}>
        {/* Sidebar */}
        <div style={{
          width:         '52px',
          background:    '#0F172A',
          borderRight:   '1px solid rgba(255,255,255,0.05)',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          padding:       '16px 0',
          gap:           '10px',
        }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'#2563EB', marginBottom:4 }} />
          {[0,1,2,3,4].map((i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: 6,
              background: i === 0 ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.05)',
            }} />
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex:1, background:'#F8FAFC', padding:'14px', overflow:'hidden', display:'flex', flexDirection:'column', gap:'10px' }}>
          {/* Stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
            {[
              { label:'Produtos',        value:'1.240', accent:'#2563EB' },
              { label:'Valor estoque',   value:'R$ 48k', accent:'#10B981' },
              { label:'Hoje',            value:'23 mov', accent:'#8B5CF6' },
              { label:'Alertas',         value:'3',      accent:'#F59E0B' },
            ].map((c) => (
              <div key={c.label} style={{
                background:'#fff', borderRadius:8, padding:'8px',
                boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ width:18, height:18, borderRadius:5, background:c.accent, marginBottom:5, opacity:0.9 }} />
                <div style={{ fontSize:9, color:'#94A3B8', marginBottom:2 }}>{c.label}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#0F172A' }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ background:'#fff', borderRadius:8, padding:'10px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', flex:'0 0 auto' }}>
            <div style={{ fontSize:9, color:'#94A3B8', marginBottom:6 }}>Movimentações — últimos 30 dias</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:52 }}>
              {BARS.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex:         1,
                    borderRadius: '2px 2px 0 0',
                    background:   i % 4 === 0 ? '#2563EB' : i % 4 === 1 ? '#93C5FD' : '#E2E8F0',
                    height:       `${h}%`,
                    transition:   'opacity 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Movement list */}
          <div style={{ background:'#fff', borderRadius:8, padding:'10px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', flex:1 }}>
            <div style={{ fontSize:9, color:'#94A3B8', marginBottom:6 }}>Últimas movimentações</div>
            {[
              { name:'Cabo HDMI 2m',   sku:'ELE-042', qty:'+20', color:'#10B981' },
              { name:'Fone Bluetooth', sku:'ELE-019', qty:'-5',  color:'#F87171' },
              { name:'Mouse sem fio',  sku:'PER-007', qty:'+12', color:'#10B981' },
              { name:'Teclado mecânico',sku:'PER-003',qty:'-3',  color:'#F87171' },
            ].map((row) => (
              <div key={row.sku} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #F1F5F9' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:18, height:18, borderRadius:4, background:'#F1F5F9' }} />
                  <div>
                    <div style={{ fontSize:9, fontWeight:600, color:'#334155' }}>{row.name}</div>
                    <div style={{ fontSize:8, color:'#94A3B8', fontFamily:'var(--font-mono)' }}>{row.sku}</div>
                  </div>
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:row.color }}>{row.qty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Video Modal ──────────────────────────────────────────────────────────────

function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         100,
        background:     'rgba(0,0,0,0.75)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation:      'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:   '#0F172A',
          borderRadius: '16px',
          border:       '1px solid rgba(255,255,255,0.1)',
          overflow:     'hidden',
          width:        '90%',
          maxWidth:     '800px',
          boxShadow:    '0 40px 100px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color:'#E2E8F0', fontWeight:600, fontSize:14 }}>Demonstração do StockPro</span>
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', color:'#94A3B8', cursor:'pointer', fontSize:20, lineHeight:1 }}
          >
            ×
          </button>
        </div>

        {/* Video placeholder */}
        <div style={{ aspectRatio:'16/9', background:'#1E293B', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:'rgba(37,99,235,0.2)',
            border:'2px solid rgba(37,99,235,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon points="5 3 19 12 5 21 5 3" fill="#2563EB"/>
            </svg>
          </div>
          <p style={{ color:'#64748B', fontSize:13, margin:0 }}>
            Vídeo de demonstração em breve
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

const COMPANY_LOGOS = ['Distribuidora Norte', 'Grupo Mares', 'TechSupply', 'Atacado JB', 'LogisPro']

export function HeroSection({ appUrl }: { appUrl: string }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section style={{
      background:    'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
      paddingTop:    '100px',
      paddingBottom: '80px',
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Background grid decoration */}
      <div style={{
        position:   'absolute',
        inset:      0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(37,99,235,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(37,99,235,0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 24px', position:'relative' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'64px', alignItems:'center' }}>

          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div style={{
              display:     'inline-flex',
              alignItems:  'center',
              gap:         '6px',
              background:  'rgba(37,99,235,0.15)',
              border:      '1px solid rgba(37,99,235,0.3)',
              borderRadius:'100px',
              padding:     '4px 12px',
              marginBottom:'24px',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', display:'inline-block' }} />
              <span style={{ fontSize:12, fontWeight:600, color:'#93C5FD', letterSpacing:'0.5px', textTransform:'uppercase' }}>
                Novo · v2.0 disponível
              </span>
            </div>

            <h1 style={{
              fontSize:     'clamp(32px, 4vw, 52px)',
              fontWeight:   800,
              lineHeight:   1.1,
              letterSpacing:'-1.5px',
              color:        '#F8FAFC',
              margin:       '0 0 20px',
            }}>
              Controle seu estoque{' '}
              <span style={{
                background:           'linear-gradient(90deg, #2563EB, #60A5FA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
              }}>
                em tempo real,
              </span>{' '}
              de onde estiver
            </h1>

            <p style={{
              fontSize:    '17px',
              lineHeight:  1.65,
              color:       '#94A3B8',
              margin:      '0 0 36px',
              maxWidth:    '480px',
            }}>
              StockPro é o sistema de gestão de estoque para empresas que precisam de agilidade — cadastre produtos, dê baixas em segundos e acompanhe tudo no dashboard ao vivo.
            </p>

            {/* CTAs */}
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'48px' }}>
              <Link
                href={`${appUrl}/register`}
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '8px',
                  background:     '#2563EB',
                  color:          '#fff',
                  fontWeight:     700,
                  fontSize:       '15px',
                  padding:        '13px 28px',
                  borderRadius:   '10px',
                  textDecoration: 'none',
                  transition:     'background 0.15s, transform 0.15s',
                  boxShadow:      '0 4px 14px rgba(37,99,235,0.35)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background='#1D4ED8'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background='#2563EB'; e.currentTarget.style.transform='translateY(0)' }}
              >
                Começar grátis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>

              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display:     'inline-flex',
                  alignItems:  'center',
                  gap:         '8px',
                  background:  'rgba(255,255,255,0.07)',
                  color:       '#E2E8F0',
                  fontWeight:  600,
                  fontSize:    '15px',
                  padding:     '13px 24px',
                  borderRadius:'10px',
                  border:      '1px solid rgba(255,255,255,0.12)',
                  cursor:      'pointer',
                  transition:  'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#94A3B8" strokeWidth="1.5"/>
                  <polygon points="10 8 16 12 10 16 10 8" fill="#94A3B8"/>
                </svg>
                Ver demonstração
              </button>
            </div>

            {/* Social proof */}
            <div>
              <p style={{ fontSize:12, color:'#64748B', margin:'0 0 12px', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 }}>
                Usado por +500 empresas
              </p>
              <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'center' }}>
                {COMPANY_LOGOS.map((name) => (
                  <div
                    key={name}
                    style={{
                      background:   'rgba(255,255,255,0.05)',
                      border:       '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding:      '6px 12px',
                      fontSize:     '11px',
                      fontWeight:   700,
                      color:        '#475569',
                      letterSpacing:'0.3px',
                      textTransform:'uppercase',
                    }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div style={{ position:'relative' }}>
            {/* Glow behind mockup */}
            <div style={{
              position:   'absolute',
              top:        '50%',
              left:       '50%',
              transform:  'translate(-50%, -50%)',
              width:      '80%',
              height:     '80%',
              background: 'radial-gradient(ellipse, rgba(37,99,235,0.25) 0%, transparent 70%)',
              filter:     'blur(40px)',
              pointerEvents:'none',
            }} />
            <DashboardMockup />
          </div>
        </div>
      </div>

      {modalOpen && <VideoModal onClose={() => setModalOpen(false)} />}
    </section>
  )
}
