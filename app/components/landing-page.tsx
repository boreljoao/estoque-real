'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'

/* ═══════════════════════════════════════════
   StockPro Landing Page — All 13 Sections
   ═══════════════════════════════════════════ */

// ──── DATA ────

const FEATURES = [
  { num: '01', title: 'Controle em tempo real', desc: 'Cada entrada e saída atualiza o sistema instantaneamente. Zero delay.', badge: 'Tempo real' },
  { num: '02', title: 'Alertas inteligentes', desc: 'Notificações antes de atingir estoque mínimo. Nunca mais ruptura.', badge: 'Automático' },
  { num: '03', title: 'Previsão com IA', desc: 'Machine learning analisa padrões e sugere quando e quanto repor.', badge: 'IA' },
  { num: '04', title: 'Multi-localização', desc: 'Gerencie depósitos, lojas e centros de distribuição em um só lugar.', badge: 'Multi-site' },
  { num: '05', title: 'Integração com PDV', desc: 'Conecta com seu ponto de venda e ERP existente via API.', badge: 'API' },
  { num: '06', title: 'Relatórios avançados', desc: 'Dashboards e relatórios exportáveis com métricas que importam.', badge: 'Analytics' },
]

const STATS = [
  { target: 99, suffix: '%', label: 'Precisão de inventário' },
  { target: 847, suffix: '+', label: 'Empresas ativas' },
  { target: 48, suffix: 'h', label: 'Para estar operacional' },
  { target: 3, suffix: 'x', label: 'Mais rápido que planilhas' },
]

const TIMELINE_STEPS = [
  { num: '01', title: 'Onboarding', desc: 'Conectamos seu sistema atual e importamos dados' },
  { num: '02', title: 'Configuração', desc: 'Parametrizamos alertas, locais e permissões' },
  { num: '03', title: 'Treinamento', desc: 'Sua equipe aprende a usar em 2 horas' },
  { num: '04', title: 'Go Live', desc: 'Operacional em até 48 horas' },
]

const FAQ_ITEMS = [
  { q: 'O StockPro substitui meu ERP?', a: 'Não. O StockPro se integra com seu ERP atual via API, complementando com inteligência de estoque que ERPs tradicionais não oferecem.' },
  { q: 'Quanto tempo leva para implementar?', a: 'A maioria das empresas está operacional em 48 horas. Oferecemos onboarding guiado com migração de dados incluída.' },
  { q: 'Funciona para múltiplos depósitos?', a: 'Sim. Gerencie quantos depósitos, lojas e centros de distribuição precisar, com transferências entre locais rastreadas.' },
  { q: 'Meus dados estão seguros?', a: 'Utilizamos criptografia AES-256 em repouso e TLS 1.3 em trânsito. Infraestrutura hospedada em data centers SOC 2 Type II.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem contratos de fidelidade. Cancele quando quiser e exporte todos os seus dados.' },
  { q: 'Vocês oferecem API para integração?', a: 'Sim. API REST completa com documentação, SDKs e webhooks para eventos em tempo real.' },
  { q: 'Como funciona a previsão com IA?', a: 'Nosso modelo analisa histórico de vendas, sazonalidade e tendências para prever demanda e sugerir pontos de reposição automaticamente.' },
  { q: 'Tem aplicativo mobile?', a: 'O StockPro é 100% responsivo e funciona perfeitamente em qualquer dispositivo. App nativo está no roadmap para Q3.' },
]

const TESTIMONIALS_GRID = [
  { quote: 'Reduziu nosso tempo de inventário de 3 dias para 4 horas. Impressionante.', name: 'Ana Ribeiro', role: 'COO, TechParts Brasil', initials: 'AR' },
  { quote: 'A previsão de IA acertou 94% das nossas necessidades de reposição no primeiro mês.', name: 'Carlos Mendes', role: 'Diretor de Supply Chain, AutoPeças SP', initials: 'CM' },
  { quote: 'O suporte é excepcional. Resolveram nossa integração com o SAP em um dia.', name: 'Fernanda Lopes', role: 'Gerente de TI, Distribuidora Norte', initials: 'FL' },
]

const DEMO_TABS = ['Visão Geral', 'Alertas', 'Relatórios', 'Previsão IA']

// ──── COMPONENT ────

export default function LandingPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isAnnual, setIsAnnual] = useState(false)
  const [gsapLoaded, setGsapLoaded] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsAnimated = useRef(false)

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }, [theme])

  // Custom cursor
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    const dot = document.createElement('div')
    dot.className = 'cursor-dot'
    document.body.appendChild(dot)
    let mx = 0, my = 0
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    const frame = () => {
      dot.style.left = mx + 'px'
      dot.style.top = my + 'px'
      requestAnimationFrame(frame)
    }
    window.addEventListener('mousemove', move)
    requestAnimationFrame(frame)
    const enter = () => dot.classList.add('hovering')
    const leave = () => dot.classList.remove('hovering')
    const targets = () => document.querySelectorAll('a, button, [role="button"]')
    const attach = () => {
      targets().forEach(el => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave) })
    }
    attach()
    const obs = new MutationObserver(attach)
    obs.observe(document.body, { childList: true, subtree: true })
    return () => {
      window.removeEventListener('mousemove', move)
      obs.disconnect()
      dot.remove()
    }
  }, [])

  // Particles
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      const size = 1 + Math.random() * 2
      p.style.width = size + 'px'
      p.style.height = size + 'px'
      p.style.left = Math.random() * 100 + '%'
      p.style.top = Math.random() * 100 + '%'
      p.style.opacity = String(0.1 + Math.random() * 0.3)
      p.style.animationDelay = -(Math.random() * 6) + 's'
      p.style.animationDuration = (4 + Math.random() * 4) + 's'
      hero.appendChild(p)
    }
  }, [])

  // Spotlight cards
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const card = (e.currentTarget as HTMLElement)
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px')
      card.style.setProperty('--my', (e.clientY - r.top) + 'px')
    }
    document.querySelectorAll('[data-spotlight]').forEach(c => {
      c.addEventListener('mousemove', handler as EventListener)
    })
  }, [])

  // CountUp animation
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true
        el.querySelectorAll<HTMLElement>('[data-target]').forEach(span => {
          const target = +(span.dataset.target || 0)
          const start = performance.now()
          const duration = 1600
          const ease = (t: number) => 1 - Math.pow(1 - t, 3)
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            span.textContent = Math.round(ease(t) * target).toLocaleString('pt-BR')
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // GSAP animations
  useEffect(() => {
    if (!gsapLoaded) return
    const g = (window as any).gsap
    const ST = (window as any).ScrollTrigger
    if (!g || !ST) return
    g.registerPlugin(ST)

    // Hero timeline
    const tl = g.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.lp-nav', { y: -60, opacity: 0, duration: 0.5 })
      .from('.hero-headline .word', { y: 50, opacity: 0, stagger: 0.05, duration: 0.65 }, '-=0.2')
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.45 }, '-=0.35')
      .from('.hero-ctas', { y: 20, opacity: 0, duration: 0.4 }, '-=0.35')
      .from('.hero-partners', { y: 16, opacity: 0, duration: 0.4 }, '-=0.3')
      .from('.hero-mockup', { y: 80, opacity: 0, rotateX: 12, duration: 1.1, ease: 'power4.out' }, '-=0.5')

    // Scroll reveals
    g.utils.toArray('.reveal').forEach((el: HTMLElement) => {
      g.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        y: 50, opacity: 0, duration: 0.7, ease: 'power3.out'
      })
    })

    // Feature stagger
    g.utils.toArray('.feature-item').forEach((el: HTMLElement, i: number) => {
      g.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        y: 20, opacity: 0, duration: 0.5, delay: i * 0.08
      })
    })

    // Problem/Solution
    g.from('.ps-col-problem', {
      scrollTrigger: { trigger: '.ps-grid', start: 'top 80%' },
      x: -60, opacity: 0, duration: 0.8
    })
    g.from('.ps-col-solution', {
      scrollTrigger: { trigger: '.ps-grid', start: 'top 80%' },
      x: 60, opacity: 0, duration: 0.8
    })

    // Testimonial hero
    g.from('.testimonial-hero-quote', {
      scrollTrigger: { trigger: '.testimonial-hero-quote', start: 'top 80%' },
      scale: 0.95, opacity: 0, duration: 0.8
    })
  }, [gsapLoaded])

  const priceMonthly = { pro: 197, enterprise: null as number | null }
  const priceAnnual = { pro: 167, enterprise: null as number | null }
  const prices = isAnnual ? priceAnnual : priceMonthly

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" onLoad={() => {}} />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
        strategy="afterInteractive"
        onLoad={() => setGsapLoaded(true)}
      />

      <a href="#main" className="skip-link">Pular para o conteúdo</a>

      {/* ═══ 01. NAV ═══ */}
      <nav className="lp-nav">
        <a href="#" className="lp-nav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ transition: 'transform 0.4s' }}>
            <rect x="4" y="4" width="20" height="20" rx="4" stroke="#00D97E" strokeWidth="2" fill="none" />
            <rect x="9" y="9" width="10" height="10" rx="2" fill="#00D97E" opacity="0.3" />
            <rect x="12" y="12" width="4" height="4" rx="1" fill="#00D97E" />
          </svg>
          <span>StockPro</span>
        </a>

        <ul className="lp-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#demo">Produto</a></li>
          <li><a href="#pricing">Preços</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className="lp-nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>
          <Link href="/login" className="btn-outline" style={{ padding: '8px 16px', fontSize: '14px' }}>Ver demo</Link>
          <Link href="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Agendar demo
          </Link>
          <button className="hamburger" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileMenu ? 'open' : ''}`}>
        <a href="#features" onClick={() => setMobileMenu(false)}>Features</a>
        <a href="#demo" onClick={() => setMobileMenu(false)}>Produto</a>
        <a href="#pricing" onClick={() => setMobileMenu(false)}>Preços</a>
        <a href="#faq" onClick={() => setMobileMenu(false)}>FAQ</a>
        <Link href="/login" onClick={() => setMobileMenu(false)}>Entrar</Link>
        <Link href="/register" className="btn-primary" onClick={() => setMobileMenu(false)}>Agendar demo</Link>
      </div>

      <main id="main">
        {/* ═══ 02. HERO ═══ */}
        <section className="lp-hero" ref={heroRef}>
          <div className="hero-grid-bg" />
          <div className="hero-glow" />
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-headline">
                <span className="word">Estoque que </span>
                <span className="word"><em>pensa</em> </span>
                <span className="word">antes de acabar.</span>
              </h1>
              <p className="hero-sub">
                Controle de entradas, saídas, alertas e previsão — em um só lugar.
                Para empresas que não improvisam.
              </p>
              <div className="hero-ctas">
                <Link href="/register" className="btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  Agendar demonstração
                </Link>
                <a href="#demo" className="btn-outline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>
                  Ver como funciona
                </a>
              </div>
              <div className="hero-partners">
                <span>Integra com</span>
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>SAP</span>
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>TOTVS</span>
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>Bling</span>
                <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>Tiny</span>
              </div>
            </div>
            <div className="hero-mockup-wrapper">
              <div className="hero-mockup">
                <div className="mockup-inner">
                  <div className="mockup-sidebar">
                    <div className="mockup-sidebar-item active">Dashboard</div>
                    <div className="mockup-sidebar-item">Produtos</div>
                    <div className="mockup-sidebar-item">Estoque</div>
                    <div className="mockup-sidebar-item">Alertas</div>
                    <div className="mockup-sidebar-item">Relatórios</div>
                  </div>
                  <div className="mockup-main">
                    <div className="mockup-metric-grid">
                      <div className="mockup-metric">
                        <div className="mockup-metric-label">Total SKUs</div>
                        <div className="mockup-metric-value">2.847</div>
                      </div>
                      <div className="mockup-metric">
                        <div className="mockup-metric-label">Estoque Baixo</div>
                        <div className="mockup-metric-value red">12</div>
                      </div>
                      <div className="mockup-metric">
                        <div className="mockup-metric-label">Entradas Hoje</div>
                        <div className="mockup-metric-value">+340</div>
                      </div>
                      <div className="mockup-metric">
                        <div className="mockup-metric-label">Valor Total</div>
                        <div className="mockup-metric-value">R$ 1.2M</div>
                      </div>
                    </div>
                    <table className="mockup-table">
                      <thead><tr><th>Produto</th><th>Qtd</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr><td>Parafuso M8x30</td><td>23</td><td><span className="mockup-badge critical">Crítico</span></td></tr>
                        <tr><td>Rolamento 6204</td><td>89</td><td><span className="mockup-badge warning">Atenção</span></td></tr>
                        <tr><td>Óleo SAE 10W40</td><td>540</td><td><span className="mockup-badge ok">OK</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 03. LOGO STRIP ═══ */}
        <section className="lp-logos reveal">
          <p className="lp-logos-label">Confiado por empresas que não brincam com estoque</p>
          <div style={{ overflow: 'hidden' }}>
            <div className="marquee-track">
              {[...Array(2)].map((_, set) => (
                ['TechParts', 'AutoPeças SP', 'Distribuidora Norte', 'Indústria Sigma', 'LogFast', 'MetalPro', 'ValeStock', 'Grupo Nexus'].map((name, i) => (
                  <span key={`${set}-${i}`} className="marquee-logo" style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                ))
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 04. PROBLEM → SOLUTION ═══ */}
        <section className="lp-problem-solution">
          <div className="ps-grid">
            <div className="ps-col-problem">
              <div className="ps-label problem">O problema</div>
              <p className="ps-text">
                Planilhas não escalam. ERPs são caros e lentos.
                Sistemas legados não se integram. Você descobre que
                acabou o estoque quando o pedido já foi confirmado.
                O resultado: vendas perdidas, clientes frustrados e
                retrabalho constante.
              </p>
            </div>
            <div className="ps-divider" />
            <div className="ps-col-solution">
              <div className="ps-label solution">A solução</div>
              <p className="ps-text">
                StockPro monitora em tempo real, alerta antes do
                problema, prevê a reposição e se integra com o seu PDV.
                Você sabe o que tem, onde está e quando vai acabar.
                Decisões baseadas em dados, não em achismo.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 05. STATS ═══ */}
        <section className="lp-stats reveal" ref={statsRef}>
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div className="stat-item" key={i}>
                <div>
                  <span className="stat-number" data-target={s.target}>0</span>
                  <span className="stat-suffix">{s.suffix}</span>
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 06. FEATURES ═══ */}
        <section className="lp-features" id="features">
          <div className="section-label reveal">Funcionalidades</div>
          <h2 className="section-title reveal">Tudo que você precisa.<br />Nada que não precisa.</h2>
          {FEATURES.map((f, i) => (
            <div className="feature-item" key={i}>
              <span className="feature-number">No. {f.num}</span>
              <div className="feature-content">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
              <span className="feature-badge">{f.badge}</span>
              <span className="feature-arrow">→</span>
            </div>
          ))}
        </section>

        {/* ═══ 07. DEMO DO PRODUTO ═══ */}
        <section className="lp-demo reveal" id="demo">
          <div className="section-label" style={{ textAlign: 'center' }}>Produto</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Veja por dentro</h2>
          <div className="demo-container">
            <div className="demo-tabs">
              {DEMO_TABS.map((tab, i) => (
                <button
                  key={i}
                  className={`demo-tab ${activeTab === i ? 'active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="demo-panel">
              {activeTab === 0 && (
                <div>
                  <div className="demo-metrics">
                    <div className="demo-metric-card"><label>Produtos Ativos</label><span className="value">2.847</span></div>
                    <div className="demo-metric-card"><label>Movimentações/dia</label><span className="value">1.203</span></div>
                    <div className="demo-metric-card"><label>Precisão</label><span className="value">99.2%</span></div>
                    <div className="demo-metric-card"><label>Alertas Ativos</label><span className="value" style={{ color: '#ff6b6b' }}>23</span></div>
                  </div>
                  <div className="demo-low-stock">
                    <h4>Produtos com estoque baixo</h4>
                    {[
                      { name: 'Parafuso M8x30', qty: 23, status: 'critical' },
                      { name: 'Rolamento 6204', qty: 89, status: 'warning' },
                      { name: 'Correia Dentada GT2', qty: 45, status: 'warning' },
                      { name: 'Filtro de Óleo HB20', qty: 12, status: 'critical' },
                      { name: 'Pastilha de Freio', qty: 67, status: 'warning' },
                    ].map((item, i) => (
                      <div className="low-stock-item" key={i}>
                        <span className="name">{item.name}</span>
                        <span className={`mockup-badge ${item.status}`}>{item.qty} un</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 1 && (
                <div>
                  <div className="alert-badge-new">23 alertas novos</div>
                  <div className="alert-feed">
                    {[
                      { dot: 'critical', text: 'Parafuso M8x30 abaixo do mínimo (23/100)', qty: '23 un' },
                      { dot: 'critical', text: 'Filtro de Óleo HB20 abaixo do mínimo (12/50)', qty: '12 un' },
                      { dot: 'warning', text: 'Rolamento 6204 atingirá mínimo em 3 dias', qty: '89 un' },
                      { dot: 'warning', text: 'Correia Dentada GT2 — reposição sugerida', qty: '45 un' },
                      { dot: 'ok', text: 'Óleo SAE 10W40 — estoque reabastecido', qty: '540 un' },
                      { dot: 'ok', text: 'Amortecedor Dianteiro — pedido recebido', qty: '200 un' },
                    ].map((a, i) => (
                      <div className="alert-item" key={i}>
                        <div className={`alert-dot ${a.dot}`} />
                        <span className="alert-text">{a.text}</span>
                        <span className="alert-qty">{a.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Movimentações mensais
                  </h4>
                  <div className="chart-bars">
                    {[
                      { label: 'Set', h: 45 }, { label: 'Out', h: 62 }, { label: 'Nov', h: 78 },
                      { label: 'Dez', h: 91 }, { label: 'Jan', h: 55 }, { label: 'Fev', h: 83 },
                      { label: 'Mar', h: 70 },
                    ].map((bar, i) => (
                      <div className="chart-bar-wrapper" key={i}>
                        <div className="chart-bar" style={{ height: `${bar.h}%` }} title={`${bar.h * 15} movimentações`} />
                        <span className="chart-bar-label">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 3 && (
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                    Projeção de demanda — Parafuso M8x30
                  </h4>
                  <svg viewBox="0 0 500 200" style={{ width: '100%', height: '200px' }}>
                    {/* Grid lines */}
                    {[40, 80, 120, 160].map(y => (
                      <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="var(--border)" strokeWidth="1" />
                    ))}
                    {/* Historical (solid) */}
                    <polyline points="0,160 70,140 140,120 210,130 280,100 350,90" fill="none" stroke="var(--accent)" strokeWidth="2" />
                    {/* Projection (dashed) */}
                    <polyline points="350,90 420,70 500,50" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6,4" />
                    {/* Area under projection */}
                    <polygon points="350,90 420,70 500,50 500,200 350,200" fill="var(--accent)" opacity="0.08" />
                    {/* Divider line */}
                    <line x1="350" y1="0" x2="350" y2="200" stroke="var(--accent)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                    <text x="170" y="190" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">Histórico</text>
                    <text x="400" y="190" fill="var(--accent)" fontSize="10" fontFamily="var(--font-mono)">Projeção</text>
                  </svg>
                  <div className="prediction-card">
                    <div className="icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    </div>
                    <span className="text">Reposição sugerida em 8 dias — 500 unidades</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ 08. TESTIMONIAL HERO ═══ */}
        <section className="lp-testimonial-hero reveal">
          <div className="testimonial-quote-mark">&ldquo;</div>
          <p className="testimonial-hero-quote">
            O StockPro eliminou 100% das nossas rupturas de estoque
            em 3 meses. ROI no primeiro trimestre.
          </p>
          <div className="testimonial-divider" />
          <div className="testimonial-avatar">RS</div>
          <div className="testimonial-name">Ricardo Santos</div>
          <div className="testimonial-role">Diretor de Operações, Grupo Nexus</div>
        </section>

        {/* Testimonials grid */}
        <div className="testimonials-grid">
          {TESTIMONIALS_GRID.map((t, i) => (
            <div className="testimonial-card" key={i} data-spotlight>
              <p className="tc-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="tc-author">
                <div className="tc-author-avatar">{t.initials}</div>
                <div>
                  <div className="tc-author-name">{t.name}</div>
                  <div className="tc-author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ 09. TIMELINE ═══ */}
        <section className="lp-timeline reveal">
          <div className="section-label" style={{ textAlign: 'center' }}>Implementação</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Em 48h, operacional.</h2>
          <div className="timeline-track">
            <div className="timeline-progress" style={{ width: '0%' }} />
            {TIMELINE_STEPS.map((step, i) => (
              <div className="timeline-step" key={i}>
                <div className="timeline-dot" />
                <div className="timeline-step-number">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 10. PRICING ═══ */}
        <section className="lp-pricing reveal" id="pricing">
          <div className="section-label" style={{ textAlign: 'center' }}>Planos</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Simples. Transparente.</h2>
          <div className="pricing-toggle">
            <span>Mensal</span>
            <button
              className={`pricing-toggle-switch ${isAnnual ? 'annual' : ''}`}
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label="Alternar mensal/anual"
            />
            <span>Anual <span style={{ color: 'var(--accent)' }}>(-15%)</span></span>
          </div>
          <div className="pricing-cards">
            {/* Essencial */}
            <div className="pricing-card">
              <div className="pricing-plan-name">Essencial</div>
              <div className="pricing-price">Grátis</div>
              <div className="pricing-description">Para começar sem compromisso</div>
              <ul className="pricing-features">
                <li>1 usuário</li>
                <li>100 produtos</li>
                <li>Estoque básico</li>
                <li>Suporte por email</li>
              </ul>
              <Link href="/register" className="btn-outline">Começar grátis</Link>
            </div>
            {/* Pro */}
            <div className="pricing-card featured">
              <div className="pricing-card-badge">Mais escolhido</div>
              <div className="pricing-plan-name">Pro</div>
              <div className="pricing-price">
                R${prices.pro}<span>/mês</span>
              </div>
              <div className="pricing-description">Para equipes que precisam de controle total</div>
              <ul className="pricing-features">
                <li>10 usuários</li>
                <li>Produtos ilimitados</li>
                <li>Fluxo de caixa</li>
                <li>Relatórios avançados</li>
                <li>Audit log</li>
                <li>Integrações API</li>
                <li>Previsão com IA</li>
              </ul>
              <Link href="/register" className="btn-primary">Começar agora</Link>
            </div>
            {/* Enterprise */}
            <div className="pricing-card">
              <div className="pricing-plan-name">Enterprise</div>
              <div className="pricing-price" style={{ fontSize: '28px' }}>Sob consulta</div>
              <div className="pricing-description">Para operações de grande escala</div>
              <ul className="pricing-features">
                <li>Usuários ilimitados</li>
                <li>Tudo do Pro</li>
                <li>SSO / SAML</li>
                <li>SLA garantido</li>
                <li>Suporte prioritário</li>
                <li>Onboarding dedicado</li>
                <li>Customizações</li>
              </ul>
              <a href="#" className="btn-outline">Fale com vendas</a>
            </div>
          </div>
        </section>

        {/* ═══ 11. FAQ ═══ */}
        <section className="lp-faq reveal" id="faq">
          <div className="section-label" style={{ textAlign: 'center' }}>Dúvidas</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Perguntas frequentes</h2>
          {FAQ_ITEMS.map((item, i) => (
            <div className="faq-item" key={i}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <span className={`faq-icon ${openFaq === i ? 'open' : ''}`}>+</span>
              </button>
              <div className={`faq-answer ${openFaq === i ? 'open' : ''}`}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ═══ 12. CTA FINAL ═══ */}
        <section className="lp-cta-final reveal">
          <div className="cta-final-box">
            <h2>Chega de adivinhar.<br />Comece a controlar.</h2>
            <Link href="/register" className="btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
              Agendar demonstração gratuita
            </Link>
            <div className="cta-avatars">
              {['RS', 'AR', 'CM', 'FL', 'JP'].map((initials, i) => (
                <div className="cta-avatar" key={i}>{initials}</div>
              ))}
              <span className="cta-social-proof">847 empresas já confiam</span>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ 13. FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="4" width="20" height="20" rx="4" stroke="#00D97E" strokeWidth="2" fill="none" />
                <rect x="12" y="12" width="4" height="4" rx="1" fill="#00D97E" />
              </svg>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>StockPro</span>
            </div>
            <p>Sistema de gestão de estoque inteligente para empresas B2B que operam com volume real.</p>
            <div className="footer-status">
              <span className="footer-status-dot" />
              Todos os sistemas operacionais
            </div>
          </div>
          <div className="footer-col">
            <h4>Produto</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Preços</a>
            <a href="#demo">Demo</a>
            <a href="#">Changelog</a>
          </div>
          <div className="footer-col">
            <h4>Empresa</h4>
            <a href="#">Sobre</a>
            <a href="#">Blog</a>
            <a href="#">Carreiras</a>
            <a href="#">Contato</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
            <a href="#">Cookies</a>
          </div>
          <div className="footer-col">
            <h4>Newsletter</h4>
            <div className="footer-newsletter">
              <input type="email" placeholder="seu@email.com" />
              <button className="btn-primary">Assinar</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 StockPro. Desenvolvido no Brasil.</span>
          <span className="footer-version">v2.4.1</span>
          <div className="footer-socials">
            <a href="#" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="#" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
