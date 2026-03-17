'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── DATA ──

const FEATURES = [
  { num: '01', title: 'Controle em tempo real', desc: 'Cada entrada e saída atualiza o sistema instantaneamente. Zero delay.', tag: 'Tempo real' },
  { num: '02', title: 'Alertas inteligentes', desc: 'Notificações antes de atingir estoque mínimo. Nunca mais ruptura.', tag: 'Automático' },
  { num: '03', title: 'Previsão com IA', desc: 'Machine learning analisa padrões e sugere quando e quanto repor.', tag: 'IA' },
  { num: '04', title: 'Multi-localização', desc: 'Gerencie depósitos, lojas e CDs em um só lugar.', tag: 'Multi-site' },
  { num: '05', title: 'Integração com PDV', desc: 'Conecta com seu ponto de venda e ERP existente via API.', tag: 'API' },
  { num: '06', title: 'Relatórios avançados', desc: 'Dashboards e relatórios exportáveis com métricas que importam.', tag: 'Analytics' },
]

const STATS = [
  { target: 99, suffix: '%', label: 'Precisão de inventário' },
  { target: 847, suffix: '+', label: 'Empresas ativas' },
  { target: 48, suffix: 'h', label: 'Para estar operacional' },
  { target: 3, suffix: 'x', label: 'Mais rápido que planilhas' },
]

const TIMELINE = [
  { num: '1', title: 'Onboarding', desc: 'Conectamos seu sistema e importamos dados' },
  { num: '2', title: 'Configuração', desc: 'Parametrizamos alertas e permissões' },
  { num: '3', title: 'Treinamento', desc: 'Sua equipe aprende em 2 horas' },
  { num: '4', title: 'Go Live', desc: 'Operacional em até 48 horas' },
]

const FAQ = [
  { q: 'O StockPro substitui meu ERP?', a: 'Não. Ele se integra com seu ERP via API, complementando com inteligência de estoque que ERPs tradicionais não oferecem.' },
  { q: 'Quanto tempo leva para implementar?', a: 'A maioria das empresas está operacional em 48 horas. Oferecemos onboarding guiado com migração de dados incluída.' },
  { q: 'Funciona para múltiplos depósitos?', a: 'Sim. Gerencie quantos depósitos, lojas e centros de distribuição precisar, com transferências rastreadas.' },
  { q: 'Meus dados estão seguros?', a: 'Criptografia AES-256 em repouso e TLS 1.3 em trânsito. Infraestrutura SOC 2 Type II.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem contratos de fidelidade. Cancele quando quiser e exporte todos os seus dados.' },
  { q: 'Vocês oferecem API?', a: 'API REST completa com documentação, SDKs e webhooks para eventos em tempo real.' },
  { q: 'Como funciona a previsão com IA?', a: 'Nosso modelo analisa histórico de vendas, sazonalidade e tendências para prever demanda automaticamente.' },
  { q: 'Tem app mobile?', a: 'O StockPro é 100% responsivo. App nativo está no roadmap para Q3.' },
]

const TESTIMONIALS = [
  { quote: 'Reduziu nosso tempo de inventário de 3 dias para 4 horas.', name: 'Ana Ribeiro', role: 'COO, TechParts Brasil', i: 'AR' },
  { quote: 'A previsão de IA acertou 94% das nossas necessidades de reposição.', name: 'Carlos Mendes', role: 'Supply Chain, AutoPeças SP', i: 'CM' },
  { quote: 'Suporte excepcional. Resolveram nossa integração com SAP em um dia.', name: 'Fernanda Lopes', role: 'Gerente de TI, Dist. Norte', i: 'FL' },
]

const TABS = ['Visão Geral', 'Alertas', 'Relatórios', 'Previsão IA']

// ── COMPONENT ──

export default function LandingPage() {
  const [menu, setMenu] = useState(false)
  const [tab, setTab] = useState(0)
  const [faq, setFaq] = useState<number | null>(null)
  const [annual, setAnnual] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  // CountUp
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true
        el.querySelectorAll<HTMLElement>('[data-target]').forEach(span => {
          const t = +(span.dataset.target || 0)
          const s = performance.now()
          const dur = 1400
          const ease = (x: number) => 1 - Math.pow(1 - x, 3)
          const tick = (now: number) => {
            const p = Math.min((now - s) / dur, 1)
            span.textContent = Math.round(ease(p) * t).toLocaleString('pt-BR')
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const price = annual ? { pro: 167 } : { pro: 197 }

  return (
    <>
      <a href="#main" className="skip-link">Pular para o conteúdo</a>

      {/* ══ NAV ══ */}
      <div className="nav-wrapper">
        <nav className="nav">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" fill="white" opacity="0.9"/><rect x="5" y="5" width="6" height="6" rx="1" fill="white"/></svg>
            </div>
            StockPro
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#demo">Produto</a>
            <a href="#pricing">Preços</a>
            <a href="#faq">FAQ</a>
          </div>
          <Link href="/register" className="nav-cta">Começar agora</Link>
          <button className="nav-hamburger" onClick={() => setMenu(!menu)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </nav>
      </div>

      {/* Mobile */}
      <div className={`mobile-overlay ${menu ? 'open' : ''}`} onClick={() => setMenu(false)} />
      <div className={`mobile-drawer ${menu ? 'open' : ''}`}>
        <a href="#features" onClick={() => setMenu(false)}>Features</a>
        <a href="#demo" onClick={() => setMenu(false)}>Produto</a>
        <a href="#pricing" onClick={() => setMenu(false)}>Preços</a>
        <a href="#faq" onClick={() => setMenu(false)}>FAQ</a>
        <Link href="/login" onClick={() => setMenu(false)}>Entrar</Link>
        <Link href="/register" className="btn btn-md btn-orange" onClick={() => setMenu(false)}>Começar agora</Link>
      </div>

      <main id="main">
        {/* ══ HERO ══ */}
        <section className="hero">
          <div className="container">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Novo: Previsão com IA disponível
            </div>
            <h1>
              Estoque que <em>pensa</em><br />antes de acabar.
            </h1>
            <p className="hero-sub">
              Controle de entradas, saídas, alertas e previsão de demanda em um só lugar. Para empresas que não improvisam.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-lg btn-orange">Agendar demonstração</Link>
              <a href="#demo" className="btn btn-lg btn-ghost">Ver como funciona</a>
            </div>
            <div className="hero-partners">
              <span>Integra com</span>
              <span>SAP</span>
              <span>TOTVS</span>
              <span>Bling</span>
              <span>Tiny</span>
            </div>
          </div>

          {/* Mockup */}
          <div className="mockup-wrapper">
            <div className="mockup">
              <div className="mockup-topbar">
                <div className="mockup-dot" />
                <div className="mockup-dot" />
                <div className="mockup-dot" />
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="mockup-sidebar-item active">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    Dashboard
                  </div>
                  <div className="mockup-sidebar-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    Produtos
                  </div>
                  <div className="mockup-sidebar-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                    Estoque
                  </div>
                  <div className="mockup-sidebar-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    Alertas
                  </div>
                  <div className="mockup-sidebar-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                    Relatórios
                  </div>
                </div>
                <div className="mockup-main">
                  <div className="mockup-greeting">Bom dia, <strong>João</strong></div>
                  <div className="mockup-title">Dashboard</div>
                  <div className="mockup-metrics">
                    <div className="mockup-card">
                      <div className="mockup-card-label">Total SKUs</div>
                      <div className="mockup-card-value">2.847</div>
                      <div className="mockup-card-change up">↑ 12% mês</div>
                    </div>
                    <div className="mockup-card">
                      <div className="mockup-card-label">Estoque Baixo</div>
                      <div className="mockup-card-value red">12</div>
                      <div className="mockup-card-change down">↓ 3 vs ontem</div>
                    </div>
                    <div className="mockup-card">
                      <div className="mockup-card-label">Entradas Hoje</div>
                      <div className="mockup-card-value green">+340</div>
                      <div className="mockup-card-change up">↑ 8%</div>
                    </div>
                    <div className="mockup-card">
                      <div className="mockup-card-label">Valor Total</div>
                      <div className="mockup-card-value">R$ 1.2M</div>
                      <div className="mockup-card-change up">↑ 5% mês</div>
                    </div>
                  </div>
                  <table className="mockup-table">
                    <thead>
                      <tr><th>Produto</th><th>SKU</th><th>Qtd</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Parafuso M8x30</td><td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>PRF-0832</td><td>23</td><td><span className="mockup-badge badge-critical">Crítico</span></td></tr>
                      <tr><td>Rolamento 6204</td><td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>ROL-6204</td><td>89</td><td><span className="mockup-badge badge-warning">Atenção</span></td></tr>
                      <tr><td>Óleo SAE 10W40</td><td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>OLE-1040</td><td>540</td><td><span className="mockup-badge badge-ok">OK</span></td></tr>
                      <tr><td>Filtro de Ar L200</td><td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>FLT-L200</td><td>156</td><td><span className="mockup-badge badge-ok">OK</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ LOGOS ══ */}
        <section className="logos">
          <div className="container">
            <p className="logos-label">Confiado por empresas que não brincam com estoque</p>
            <div className="logos-track">
              {['TechParts', 'AutoPeças SP', 'Dist. Norte', 'Ind. Sigma', 'LogFast', 'MetalPro'].map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PROBLEM / SOLUTION ══ */}
        <section className="section section-warm">
          <div className="container">
            <div className="ps-grid">
              <div className="ps-col problem">
                <h3>O problema</h3>
                <p>
                  Planilhas não escalam. ERPs são caros e lentos.
                  Sistemas legados não se integram. Você descobre que
                  acabou o estoque quando o pedido já foi confirmado.
                  Resultado: vendas perdidas e retrabalho constante.
                </p>
              </div>
              <div className="ps-col solution">
                <h3>A solução</h3>
                <p>
                  StockPro monitora em tempo real, alerta antes do
                  problema, prevê a reposição e se integra com o seu PDV.
                  Você sabe o que tem, onde está e quando vai acabar.
                  Decisões baseadas em dados, não em achismo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STATS ══ */}
        <section className="section" ref={statsRef}>
          <div className="container">
            <div className="stats-row">
              {STATS.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div>
                    <span className="stat-number" data-target={s.target}>0</span>
                    <span className="stat-suffix">{s.suffix}</span>
                  </div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="section section-muted" id="features">
          <div className="container" style={{ maxWidth: '860px' }}>
            <div className="section-label">Funcionalidades</div>
            <h2 className="section-title">Tudo que você precisa.<br />Nada que não precisa.</h2>
            <div className="features-list">
              {FEATURES.map((f, i) => (
                <div className="feature-row" key={i}>
                  <span className="feature-num">No. {f.num}</span>
                  <div>
                    <div className="feature-title">{f.title}</div>
                    <div className="feature-desc">{f.desc}</div>
                  </div>
                  <span className="feature-tag">{f.tag}</span>
                  <span className="feature-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ DEMO ══ */}
        <section className="section" id="demo">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div className="section-label">Produto</div>
              <h2 className="section-title">Veja por dentro</h2>
            </div>
            <div className="demo-wrap">
              <div className="demo-sidebar">
                {TABS.map((t, i) => (
                  <button key={i} className={`demo-tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="demo-content">
                {tab === 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      {[
                        { l: 'Produtos Ativos', v: '2.847' },
                        { l: 'Movimentações/dia', v: '1.203' },
                        { l: 'Precisão', v: '99.2%' },
                        { l: 'Alertas Ativos', v: '23', c: '#E53935' },
                      ].map((m, i) => (
                        <div key={i} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-soft)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{m.l}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: m.c || 'var(--orange)' }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Estoque baixo</div>
                    {[
                      { n: 'Parafuso M8x30', q: 23, s: 'badge-critical' },
                      { n: 'Rolamento 6204', q: 89, s: 'badge-warning' },
                      { n: 'Correia GT2', q: 45, s: 'badge-warning' },
                      { n: 'Filtro HB20', q: 12, s: 'badge-critical' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-soft)', borderRadius: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.n}</span>
                        <span className={`mockup-badge ${item.s}`}>{item.q} un</span>
                      </div>
                    ))}
                  </>
                )}
                {tab === 1 && (
                  <>
                    <div className="alert-badge-new">23 alertas novos</div>
                    {[
                      { d: 'red', t: 'Parafuso M8x30 abaixo do mínimo (23/100)', q: '23 un' },
                      { d: 'red', t: 'Filtro HB20 abaixo do mínimo (12/50)', q: '12 un' },
                      { d: 'yellow', t: 'Rolamento 6204 atingirá mínimo em 3 dias', q: '89 un' },
                      { d: 'yellow', t: 'Correia GT2 — reposição sugerida', q: '45 un' },
                      { d: 'green', t: 'Óleo SAE 10W40 — estoque reabastecido', q: '540 un' },
                      { d: 'green', t: 'Amortecedor — pedido recebido', q: '200 un' },
                    ].map((a, i) => (
                      <div className="alert-row" key={i}>
                        <div className={`alert-dot ${a.d}`} />
                        <span className="alert-text">{a.t}</span>
                        <span className="alert-qty">{a.q}</span>
                      </div>
                    ))}
                  </>
                )}
                {tab === 2 && (
                  <>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Movimentações mensais</div>
                    <div className="chart-bars">
                      {[
                        { l: 'Set', h: 45 }, { l: 'Out', h: 62 }, { l: 'Nov', h: 78 },
                        { l: 'Dez', h: 91 }, { l: 'Jan', h: 55 }, { l: 'Fev', h: 83 },
                        { l: 'Mar', h: 70 },
                      ].map((b, i) => (
                        <div className="chart-col" key={i}>
                          <div className="chart-bar" style={{ height: `${b.h}%` }} />
                          <span className="chart-bar-label">{b.l}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {tab === 3 && (
                  <>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '16px' }}>Projeção de demanda — Parafuso M8x30</div>
                    <svg viewBox="0 0 500 180" style={{ width: '100%', height: '180px' }}>
                      {[36, 72, 108, 144].map(y => (
                        <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#F0F0F0" strokeWidth="1" />
                      ))}
                      <polyline points="0,150 70,130 140,110 210,120 280,90 350,80" fill="none" stroke="#FF6B2C" strokeWidth="2.5" />
                      <polyline points="350,80 420,60 500,40" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeDasharray="6,4" />
                      <polygon points="350,80 420,60 500,40 500,180 350,180" fill="#FF6B2C" opacity="0.06" />
                      <line x1="350" y1="0" x2="350" y2="180" stroke="#FF6B2C" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
                      <text x="150" y="172" fill="#999" fontSize="10" fontFamily="var(--font-mono)">Histórico</text>
                      <text x="400" y="172" fill="#FF6B2C" fontSize="10" fontFamily="var(--font-mono)">Projeção</text>
                    </svg>
                    <div className="predict-card">
                      <div className="predict-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      </div>
                      <span className="predict-text">Reposição sugerida em 8 dias — 500 unidades</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIAL HERO ══ */}
        <section className="section section-warm">
          <div className="container">
            <div className="testimonial-hero-section">
              <div className="tq-mark">&ldquo;</div>
              <p className="tq-text">
                O StockPro eliminou 100% das nossas rupturas de estoque
                em 3 meses. ROI no primeiro trimestre.
              </p>
              <div className="tq-line" />
              <div className="tq-avatar">RS</div>
              <div className="tq-name">Ricardo Santos</div>
              <div className="tq-role">Diretor de Operações, Grupo Nexus</div>
            </div>
          </div>
        </section>

        {/* Testimonials grid */}
        <section className="section">
          <div className="container">
            <div className="tg-grid">
              {TESTIMONIALS.map((t, idx) => (
                <div className="tg-card" key={idx}>
                  <p className="tg-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="tg-author">
                    <div className="tg-author-avatar">{t.i}</div>
                    <div>
                      <div className="tg-author-name">{t.name}</div>
                      <div className="tg-author-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TIMELINE ══ */}
        <section className="section section-muted">
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-label">Implementação</div>
            <h2 className="section-title">Em 48h, operacional.</h2>
            <div className="timeline-row">
              {TIMELINE.map((s, i) => (
                <div className="tl-step" key={i}>
                  <div className="tl-num">{s.num}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PRICING ══ */}
        <section className="section" id="pricing">
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-label">Planos</div>
            <h2 className="section-title">Simples e transparente.</h2>
            <div className="pricing-toggle">
              <span>Mensal</span>
              <button className={`toggle-switch ${annual ? 'on' : ''}`} onClick={() => setAnnual(!annual)} aria-label="Alternar plano" />
              <span>Anual <span style={{ color: 'var(--orange)', fontWeight: 600 }}>-15%</span></span>
            </div>
            <div className="pricing-grid">
              <div className="price-card">
                <div className="price-name">Essencial</div>
                <div className="price-value">Grátis</div>
                <div className="price-desc">Para começar sem compromisso</div>
                <ul className="price-features">
                  <li>1 usuário</li>
                  <li>100 produtos</li>
                  <li>Estoque básico</li>
                  <li>Suporte por email</li>
                </ul>
                <Link href="/register" className="btn btn-md btn-ghost">Começar grátis</Link>
              </div>
              <div className="price-card featured">
                <div className="price-card-badge">Mais escolhido</div>
                <div className="price-name">Pro</div>
                <div className="price-value">R${price.pro}<span>/mês</span></div>
                <div className="price-desc">Controle total para equipes</div>
                <ul className="price-features">
                  <li>10 usuários</li>
                  <li>Produtos ilimitados</li>
                  <li>Fluxo de caixa</li>
                  <li>Relatórios avançados</li>
                  <li>Audit log</li>
                  <li>Integrações API</li>
                  <li>Previsão com IA</li>
                </ul>
                <Link href="/register" className="btn btn-md btn-orange">Começar agora</Link>
              </div>
              <div className="price-card">
                <div className="price-name">Enterprise</div>
                <div className="price-value" style={{ fontSize: '28px' }}>Sob consulta</div>
                <div className="price-desc">Para operações de grande escala</div>
                <ul className="price-features">
                  <li>Usuários ilimitados</li>
                  <li>Tudo do Pro</li>
                  <li>SSO / SAML</li>
                  <li>SLA garantido</li>
                  <li>Suporte prioritário</li>
                  <li>Onboarding dedicado</li>
                </ul>
                <a href="#" className="btn btn-md btn-ghost">Fale com vendas</a>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section className="section section-warm" id="faq">
          <div className="container" style={{ maxWidth: '700px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div className="section-label">Dúvidas</div>
              <h2 className="section-title">Perguntas frequentes</h2>
            </div>
            {FAQ.map((item, i) => (
              <div className="faq-item" key={i}>
                <button className="faq-q" onClick={() => setFaq(faq === i ? null : i)}>
                  <span>{item.q}</span>
                  <span className={`faq-icon ${faq === i ? 'open' : ''}`}>+</span>
                </button>
                <div className={`faq-a ${faq === i ? 'open' : ''}`}>
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ CTA FINAL ══ */}
        <section className="section">
          <div className="container">
            <div className="cta-box">
              <h2>Chega de adivinhar.<br />Comece a controlar.</h2>
              <Link href="/register" className="btn btn-lg btn-orange">Agendar demonstração gratuita</Link>
              <div className="cta-proof">
                {['RS', 'AR', 'CM', 'FL', 'JP'].map((init, i) => (
                  <div className="cta-av" key={i}>{init}</div>
                ))}
                <span className="cta-proof-text">847 empresas já confiam</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div className="nav-logo-icon" style={{ width: '24px', height: '24px' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" fill="white" opacity="0.9"/></svg>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px' }}>StockPro</span>
              </div>
              <p>Gestão de estoque inteligente para empresas B2B que operam com volume real.</p>
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
          </div>
          <div className="footer-bottom">
            <span>© 2026 StockPro. Desenvolvido no Brasil.</span>
            <span className="footer-version">v2.4.1</span>
            <div className="footer-socials">
              <a href="#" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
