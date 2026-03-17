'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── ICONS ──
const icons = {
  box: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  bag: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  trend: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>,
  bell: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  chart: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  lock: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  monitor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  zap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  globe: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  pulse: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  barChart: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  shopping: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
}

// ── DATA ──
const FEATURES = [
  { title: 'Controle em tempo real', desc: 'Cada entrada e saída atualiza instantaneamente. Saiba exatamente o que tem, onde tem e quanto vale.', icon: icons.pulse },
  { title: 'Gestão de produtos e vendas', desc: 'Cadastre produtos, categorias, variações. Registre vendas e acompanhe performance por item.', icon: icons.shopping },
  { title: 'Relatórios inteligentes', desc: 'Dashboards com métricas de estoque, vendas e movimentação. Exporte em PDF e Excel.', icon: icons.barChart },
  { title: 'Acesso 100% online', desc: 'Acesse de qualquer lugar, qualquer dispositivo. Sem instalar nada, sem configurar servidor.', icon: icons.globe },
]

const STEPS = [
  { num: '1', title: 'Crie sua conta', desc: 'Preencha seus dados e escolha o nome da sua organização.' },
  { num: '2', title: 'Escolha e pague', desc: 'Selecione o plano ideal. Pague com cartão ou Pix.' },
  { num: '3', title: 'Pronto para usar', desc: 'Acesse imediatamente seu painel completo.' },
]

const TESTIMONIALS = [
  { name: 'Ricardo Mendes', role: 'Dono — Distribuidora RM', initials: 'RM', text: 'Antes eu controlava tudo em planilha e vivia perdendo mercadoria. Com o StockPro, em 10 minutos eu já estava operando.' },
  { name: 'Ana Beatriz Souza', role: 'Gerente — Empório Natural', initials: 'AB', text: 'A facilidade impressiona. Minha equipe aprendeu no primeiro dia. Os relatórios me dão controle total do negócio.' },
  { name: 'Carlos Eduardo Lima', role: 'CEO — Tech Parts LTDA', initials: 'CE', text: 'Testei 4 sistemas antes. A velocidade de ativação e a interface profissional não têm comparação.' },
]

const PRICING = [
  { name: 'Pro', price: 97, yearly: 82, desc: 'Para negócios em crescimento', features: ['Até 5.000 produtos', '5 usuários', 'Relatórios avançados', 'Alertas inteligentes', 'Multi-localização', 'Suporte prioritário'], featured: false },
  { name: 'Enterprise', price: 297, yearly: 252, desc: 'Para operações de grande escala', features: ['Produtos ilimitados', 'Usuários ilimitados', 'Previsão com IA', 'API completa', 'Integrações ERP', 'Gerente dedicado', 'SLA 99.9%'], featured: true },
]

type MockupView = 'dashboard' | 'products' | 'stock' | 'alerts' | 'reports'

// ── REVEAL HOOK ──
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    el.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((r) => obs.observe(r))
    return () => obs.disconnect()
  }, [])
  return ref
}

// ── MOCKUP VIEWS ──
function DashboardView() {
  return (
    <div className="mockup-view" key="dashboard">
      <div className="m-metrics">
        <div className="m-card"><div className="m-card-label">Produtos</div><div className="m-card-val">1.847</div><div className="m-card-delta up">↑ 12% mês</div></div>
        <div className="m-card"><div className="m-card-label">Estoque Baixo</div><div className="m-card-val red">23</div><div className="m-card-delta down">↓ 3 novos</div></div>
        <div className="m-card"><div className="m-card-label">Movimentações</div><div className="m-card-val blue">342</div><div className="m-card-delta up">↑ 8% mês</div></div>
        <div className="m-card"><div className="m-card-label">Valor em Estoque</div><div className="m-card-val green">R$ 284k</div><div className="m-card-delta up">↑ 15%</div></div>
      </div>
      <div className="m-grid">
        <div className="m-box">
          <div className="m-box-title">Movimentações — Últimos 7 dias</div>
          <div className="m-bars">
            {[45, 62, 38, 78, 55, 92, 68].map((h, i) => (
              <div className="m-bar-col" key={i}>
                <div className="m-bar" style={{ height: `${h}%`, background: i === 5 ? 'var(--orange)' : 'var(--orange-light)', opacity: i === 5 ? 1 : 0.7 }} />
                <div className="m-bar-label">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="m-box">
          <div className="m-box-title">Alertas Críticos</div>
          <div className="m-list-item"><span>Parafuso M8</span><span className="m-badge critical">3 un</span></div>
          <div className="m-list-item"><span>Cabo USB-C</span><span className="m-badge critical">7 un</span></div>
          <div className="m-list-item"><span>Cola Epóxi</span><span className="m-badge warning">15 un</span></div>
          <div className="m-list-item"><span>Fita Isolante</span><span className="m-badge warning">18 un</span></div>
          <div className="m-list-item"><span>Caixa Papelão</span><span className="m-badge ok">42 un</span></div>
        </div>
      </div>
    </div>
  )
}

function ProductsView() {
  return (
    <div className="mockup-view" key="products">
      <div className="m-table-header">
        <div className="m-table-title">Produtos</div>
        <div className="m-table-actions">
          <span className="m-btn-sm m-btn-ghost">Exportar</span>
          <span className="m-btn-sm m-btn-primary">+ Novo Produto</span>
        </div>
      </div>
      <div className="m-filters">
        <span className="m-filter active">Todos</span>
        <span className="m-filter">Ativos</span>
        <span className="m-filter">Estoque Baixo</span>
        <span className="m-filter">Inativos</span>
      </div>
      <table className="m-table">
        <thead><tr>
          {['Produto', 'SKU', 'Categoria', 'Estoque', 'Preço', 'Status'].map(h => <th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {[
            ['Parafuso M8 Inox', 'PRF-M8-001', 'Fixação', '1.247', 'R$ 0,45', 'ok'],
            ['Cabo USB-C 1m', 'CBL-USBC-01', 'Eletrônico', '7', 'R$ 24,90', 'critical'],
            ['Cola Epóxi Bicomp', 'CLA-EPX-002', 'Adesivo', '15', 'R$ 32,50', 'warning'],
            ['Chave Phillips #2', 'FER-PHL-002', 'Ferramenta', '89', 'R$ 18,90', 'ok'],
            ['Fita Isolante 20m', 'FIT-ISO-003', 'Elétrico', '18', 'R$ 8,70', 'warning'],
          ].map(([n, sku, cat, qty, price, st], i) => (
            <tr key={i}>
              <td style={{ color: 'var(--text)', fontWeight: 500 }}>{n}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{sku}</td>
              <td>{cat}</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{qty}</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{price}</td>
              <td><span className={`m-badge ${st}`}>{st === 'ok' ? 'Normal' : st === 'critical' ? 'Crítico' : 'Baixo'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="m-table-page">
        <span>Mostrando 1-5 de 1.847</span>
        <div className="m-page-btns">
          <span className="m-page-btn active">1</span>
          <span className="m-page-btn">2</span>
          <span className="m-page-btn">3</span>
          <span className="m-page-btn">...</span>
          <span className="m-page-btn">370</span>
        </div>
      </div>
    </div>
  )
}

function StockView() {
  return (
    <div className="mockup-view" key="stock">
      <div className="m-table-header">
        <div className="m-table-title">Movimentações</div>
        <div className="m-table-actions"><span className="m-btn-sm m-btn-primary">+ Nova Movimentação</span></div>
      </div>
      <div className="m-metrics" style={{ marginBottom: 14 }}>
        <div className="m-card"><div className="m-card-label">Entradas Hoje</div><div className="m-card-val green">+47</div></div>
        <div className="m-card"><div className="m-card-label">Saídas Hoje</div><div className="m-card-val red">-31</div></div>
        <div className="m-card"><div className="m-card-label">Transferências</div><div className="m-card-val blue">12</div></div>
        <div className="m-card"><div className="m-card-label">Ajustes</div><div className="m-card-val orange">4</div></div>
      </div>
      <table className="m-table">
        <thead><tr>
          {['Data', 'Tipo', 'Produto', 'Qtd', 'Antes → Depois', 'Usuário'].map(h => <th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {[
            ['17/03 09:14', 'Entrada', 'Parafuso M8 Inox', '+500', '747 → 1.247', 'João P.'],
            ['17/03 08:52', 'Saída', 'Cabo USB-C 1m', '-15', '22 → 7', 'Maria S.'],
            ['17/03 08:30', 'Transfer.', 'Cola Epóxi', '+20', '0 → 20', 'João P.'],
            ['16/03 17:45', 'Ajuste', 'Fita Isolante', '-2', '20 → 18', 'Admin'],
          ].map(([date, type, prod, qty, ba, user], i) => (
            <tr key={i}>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{date}</td>
              <td><span className={`m-badge ${type === 'Entrada' ? 'ok' : type === 'Saída' ? 'critical' : 'warning'}`}>{type}</span></td>
              <td style={{ fontWeight: 500, color: 'var(--text)' }}>{prod}</td>
              <td style={{ fontFamily: 'var(--font-mono)', color: qty.startsWith('+') ? 'var(--green)' : qty.startsWith('-') ? 'var(--red)' : 'var(--text)' }}>{qty}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{ba}</td>
              <td>{user}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AlertsView() {
  return (
    <div className="mockup-view" key="alerts">
      <div className="m-table-header">
        <div className="m-table-title">Alertas de Estoque</div>
        <div className="m-table-actions"><span className="m-btn-sm m-btn-ghost" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }}>12 críticos</span></div>
      </div>
      <div className="m-filters">
        <span className="m-filter active">Todos</span>
        <span className="m-filter">Crítico</span>
        <span className="m-filter">Atenção</span>
        <span className="m-filter">Resolvidos</span>
      </div>
      {[
        { name: 'Cabo USB-C 1m', qty: '7 un', min: 'Mín: 50', dot: 'red' },
        { name: 'Parafuso M8 Inox', qty: '3 un', min: 'Mín: 100', dot: 'red' },
        { name: 'Resistor 10kΩ', qty: '12 un', min: 'Mín: 200', dot: 'red' },
        { name: 'Cola Epóxi Bicomponente', qty: '15 un', min: 'Mín: 30', dot: 'yellow' },
        { name: 'Fita Isolante 20m', qty: '18 un', min: 'Mín: 25', dot: 'yellow' },
        { name: 'Caixa Papelão G', qty: '42 un', min: 'Mín: 50', dot: 'yellow' },
      ].map((a, i) => (
        <div className="m-alert-card" key={i}>
          <div className={`m-alert-dot ${a.dot}`} />
          <div className="m-alert-text">{a.name}<span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{a.min}</span></div>
          <div className="m-alert-qty">{a.qty}</div>
        </div>
      ))}
    </div>
  )
}

function ReportsView() {
  return (
    <div className="mockup-view" key="reports">
      <div className="m-table-header">
        <div className="m-table-title">Relatórios</div>
        <div className="m-table-actions">
          <span className="m-btn-sm m-btn-ghost">PDF</span>
          <span className="m-btn-sm m-btn-ghost">Excel</span>
          <span className="m-btn-sm m-btn-primary">Gerar Relatório</span>
        </div>
      </div>
      <div className="m-kpis">
        <div className="m-kpi"><div className="m-kpi-val" style={{ color: 'var(--green)' }}>R$ 47.2k</div><div className="m-kpi-label">Entradas (mês)</div></div>
        <div className="m-kpi"><div className="m-kpi-val" style={{ color: 'var(--red)' }}>R$ 31.8k</div><div className="m-kpi-label">Saídas (mês)</div></div>
        <div className="m-kpi"><div className="m-kpi-val" style={{ color: 'var(--orange)' }}>98.2%</div><div className="m-kpi-label">Precisão</div></div>
      </div>
      <div className="m-box">
        <div className="m-box-title">Valor em Estoque — Últimos 6 meses</div>
        <div className="m-bars" style={{ height: 150 }}>
          {[55, 62, 58, 72, 80, 90].map((h, i) => (
            <div className="m-bar-col" key={i}>
              <div className="m-bar" style={{ height: `${h}%`, background: i >= 4 ? 'var(--orange)' : 'var(--orange-light)', opacity: i >= 4 ? 1 : 0.6 }} />
              <div className="m-bar-label">{['Out','Nov','Dez','Jan','Fev','Mar'][i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const VIEWS: Record<MockupView, { label: string; icon: JSX.Element; component: () => JSX.Element }> = {
  dashboard: { label: 'Dashboard', icon: icons.grid, component: DashboardView },
  products: { label: 'Produtos', icon: icons.bag, component: ProductsView },
  stock: { label: 'Movimentações', icon: icons.trend, component: StockView },
  alerts: { label: 'Alertas', icon: icons.bell, component: AlertsView },
  reports: { label: 'Relatórios', icon: icons.chart, component: ReportsView },
}

// ── INTERACTIVE MOCKUP ──
function InteractiveMockup({ defaultView = 'dashboard' as MockupView }) {
  const [view, setView] = useState<MockupView>(defaultView)
  const [viewKey, setViewKey] = useState(0)
  const ViewComponent = VIEWS[view].component

  const changeView = (v: MockupView) => {
    if (v === view) return
    setView(v)
    setViewKey(k => k + 1)
  }

  return (
    <div className="mockup">
      <div className="mockup-topbar">
        <div className="mockup-dots">
          <div className="mockup-dot" /><div className="mockup-dot" /><div className="mockup-dot" />
        </div>
        <div className="mockup-url">
          {icons.lock}
          app.stockpro.com.br/{view === 'dashboard' ? 'dashboard' : view}
        </div>
      </div>
      <div className="mockup-body">
        <div className="mockup-side">
          <div className="mockup-side-logo">
            <span className="mockup-side-logo-box">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            </span>
            StockPro
          </div>
          <div className="mockup-side-section">Menu</div>
          {(Object.keys(VIEWS) as MockupView[]).map((key) => (
            <button
              key={key}
              className={`mockup-side-btn${view === key ? ' active' : ''}`}
              onClick={() => changeView(key)}
            >
              {VIEWS[key].icon}
              {VIEWS[key].label}
              {key === 'alerts' && <span className="mockup-side-badge">12</span>}
            </button>
          ))}
          <div className="mockup-side-user">
            <div className="mockup-side-avatar">JP</div>
            <div>
              <div style={{ fontSize: 12, color: '#eee', fontWeight: 600 }}>João P.</div>
              <div style={{ fontSize: 10, color: '#777' }}>Admin</div>
            </div>
          </div>
        </div>
        <div className="mockup-content">
          <ViewComponent key={viewKey} />
        </div>
      </div>
    </div>
  )
}

// ── MAIN LANDING PAGE ──
export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [annual, setAnnual] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pageRef = useReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={pageRef}>
      {/* NAV */}
      <div className="nav-wrapper">
        <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
          <Link href="/" className="nav-logo">
            <span className="nav-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </span>
            StockPro
          </Link>
          <div className="nav-links">
            <a href="#steps">Como funciona</a>
            <a href="#features">Recursos</a>
            <a href="#pricing">Preços</a>
          </div>
          <Link href="/login" className="nav-cta">Começar agora</Link>
          <button className="nav-hamburger" onClick={() => setMobileMenu(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </nav>
      </div>

      {/* Mobile */}
      <div className={`mobile-overlay${mobileMenu ? ' open' : ''}`} onClick={() => setMobileMenu(false)} />
      <div className={`mobile-drawer${mobileMenu ? ' open' : ''}`}>
        <a href="#steps" onClick={() => setMobileMenu(false)}>Como funciona</a>
        <a href="#features" onClick={() => setMobileMenu(false)}>Recursos</a>
        <a href="#pricing" onClick={() => setMobileMenu(false)}>Preços</a>
        <a href="#testimonials" onClick={() => setMobileMenu(false)}>Depoimentos</a>
        <Link href="/login" onClick={() => setMobileMenu(false)} className="btn btn-orange btn-md" style={{ marginTop: 16 }}>Começar agora</Link>
      </div>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Plataforma 100% cloud
        </div>

        <h1>
          Gerencie seu estoque<br />
          <span className="orange">em minutos, direto da nuvem</span>
        </h1>

        <p className="hero-sub">
          Crie sua conta, pague e comece a usar imediatamente.<br />
          Sem instalação, sem complicação.
        </p>

        <div className="hero-actions">
          <Link href="/register" className="btn btn-orange btn-lg">
            Começar agora {icons.arrow}
          </Link>
          <a href="#features" className="btn btn-outline btn-lg">Ver recursos</a>
        </div>

        <div className="hero-trust">
          <div className="hero-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Sem cartão para testar
          </div>
          <div className="hero-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Setup em 2 minutos
          </div>
          <div className="hero-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Cancele quando quiser
          </div>
        </div>

        {/* Interactive dashboard */}
        <div className="mockup-container">
          <div className="mockup-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 15l-2 5L9 9l11 4-5 2z"/></svg>
            Clique no menu para navegar
          </div>
          <InteractiveMockup />
        </div>
      </section>

      {/* ── STEPS ── */}
      <div className="divider" />
      <section className="section section-muted" id="steps">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="reveal">
            <div className="section-label">Como funciona</div>
            <h2 className="section-title">
              Comece a usar em <span className="orange">3 passos simples</span>
            </h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Sem burocracia. Do cadastro ao primeiro acesso em menos de 5 minutos.
            </p>
          </div>
          <div className="steps-row">
            {STEPS.map((s, i) => (
              <div key={i} className={`step-item reveal reveal-d${i + 2}`}>
                <div className="step-circle">{s.num}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="features">
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="section-label">Recursos</div>
            <h2 className="section-title">
              Tudo para ter <span className="orange">controle total</span>
            </h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Funcionalidades pensadas para simplificar sua gestão e impulsionar resultados.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`feat-card reveal reveal-d${i + 1}`}>
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Second mockup — Products view */}
          <div className="reveal-scale" style={{ marginTop: 64 }}>
            <div className="mockup-container" style={{ padding: 0 }}>
              <InteractiveMockup defaultView="products" />
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTANT ACTIVATION ── */}
      <div className="divider" />
      <section className="section section-warm">
        <div className="container">
          <div className="instant-grid">
            <div className="reveal-left">
              <div className="section-label">Ativação instantânea</div>
              <h2 className="section-title">
                Sem espera.<br /><span className="orange">Sem instalação.</span>
              </h2>
              <p className="section-desc" style={{ marginBottom: 32 }}>
                Após o pagamento, seu sistema é liberado automaticamente. Sem técnicos, sem configuração. Comece a usar na mesma hora.
              </p>
              <Link href="/register" className="btn btn-orange btn-md">
                Ativar meu sistema {icons.arrow}
              </Link>
            </div>
            <div className="reveal-right">
              <div className="instant-stack">
                <div className="instant-item">
                  <div className="instant-icon">{icons.check}</div>
                  <div><div className="instant-text">Pagamento confirmado</div><div className="instant-sub">Stripe processa em segundos</div></div>
                </div>
                <div className="instant-item">
                  <div className="instant-icon">{icons.monitor}</div>
                  <div><div className="instant-text">Sistema provisionado</div><div className="instant-sub">Banco, painel e acesso criados</div></div>
                </div>
                <div className="instant-item">
                  <div className="instant-icon">{icons.zap}</div>
                  <div><div className="instant-text" style={{ color: 'var(--orange)' }}>Pronto para usar!</div><div className="instant-sub">Acesse o painel completo agora</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" id="pricing">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="reveal">
            <div className="section-label">Preços</div>
            <h2 className="section-title">
              Planos que <span className="orange">cabem no seu bolso</span>
            </h2>
            <p className="section-desc" style={{ margin: '0 auto 40px' }}>
              Escolha o plano ideal. Cancele quando quiser.
            </p>
          </div>
          <div className="pricing-toggle reveal">
            <span style={{ color: !annual ? 'var(--text)' : undefined, fontWeight: !annual ? 600 : undefined }}>Mensal</span>
            <button className={`toggle-switch${annual ? ' on' : ''}`} onClick={() => setAnnual(!annual)} aria-label="Toggle anual" />
            <span style={{ color: annual ? 'var(--text)' : undefined, fontWeight: annual ? 600 : undefined }}>Anual</span>
            {annual && <span className="pricing-save">-15%</span>}
          </div>
          <div className="pricing-grid reveal">
            {PRICING.map((p, i) => (
              <div key={i} className={`price-card${p.featured ? ' featured' : ''}`}>
                {p.featured && <div className="price-card-badge">MAIS POPULAR</div>}
                <div className="price-name">{p.name}</div>
                <div className="price-value">R${annual ? p.yearly : p.price}<span>/mês</span></div>
                <div className="price-desc">{p.desc}</div>
                <ul className="price-features">
                  {p.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                <Link href="/register" className={`btn btn-md ${p.featured ? 'btn-orange' : 'btn-outline'}`}>Começar agora</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <div className="divider" />
      <section className="section section-muted" id="testimonials">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="reveal">
            <div className="section-label">Depoimentos</div>
            <h2 className="section-title">Quem usa, <span className="orange">recomenda</span></h2>
          </div>
          <div className="test-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`test-card reveal reveal-d${i + 1}`}>
                <div className="test-stars">★★★★★</div>
                <div className="test-text">&ldquo;{t.text}&rdquo;</div>
                <div className="test-author">
                  <div className="test-avatar">{t.initials}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div className="test-name">{t.name}</div>
                    <div className="test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="section">
        <div className="container">
          <div className="cta-box reveal-scale">
            <h2>Comece agora e tenha controle total<br />do seu estoque ainda hoje</h2>
            <p>Sem instalação. Sem espera. Pronto em minutos.</p>
            <Link href="/register" className="btn btn-orange btn-lg">
              Criar minha conta grátis {icons.arrow}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-brand-name">
                <span className="nav-logo-icon" style={{ width: 28, height: 28, borderRadius: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                </span>
                StockPro
              </div>
              <p>Gestão de estoque inteligente para empresas que não improvisam.</p>
              <div className="footer-status"><span className="footer-status-dot" /> Todos os sistemas operacionais</div>
            </div>
            <div className="footer-col">
              <h4>Produto</h4>
              <a href="#features">Recursos</a>
              <a href="#pricing">Preços</a>
              <a href="#steps">Como funciona</a>
            </div>
            <div className="footer-col">
              <h4>Empresa</h4>
              <a href="#">Sobre</a>
              <a href="#">Blog</a>
              <a href="#">Contato</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Termos de uso</a>
              <a href="#">Privacidade</a>
              <a href="#">SLA</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; {new Date().getFullYear()} StockPro. Todos os direitos reservados.</span>
            <div className="footer-socials">
              <a href="#" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
              <a href="#" aria-label="Twitter"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a>
              <a href="#" aria-label="GitHub"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
