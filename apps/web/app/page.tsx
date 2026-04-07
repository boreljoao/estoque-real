import Link from 'next/link'
import { HeroSection } from './components/HeroSection'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.stockpro.com.br'

// ─── Shared layout helpers ────────────────────────────────────────────────────

function Section({
  id,
  children,
  style,
}: {
  id?:      string
  children: React.ReactNode
  style?:   React.CSSProperties
}) {
  return (
    <section id={id} style={{ padding: '96px 24px', ...style }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display:         'inline-flex',
      alignItems:      'center',
      gap:             '6px',
      background:      '#EFF6FF',
      border:          '1px solid #BFDBFE',
      borderRadius:    '100px',
      padding:         '4px 12px',
      fontSize:        '12px',
      fontWeight:      600,
      color:           '#2563EB',
      letterSpacing:   '0.5px',
      textTransform:   'uppercase',
      marginBottom:    '16px',
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2 style={{
      fontSize:     'clamp(28px, 4vw, 40px)',
      fontWeight:   800,
      letterSpacing:'-1px',
      color:        '#0F172A',
      margin:       '0 0 12px',
      textAlign:    center ? 'center' : 'left',
    }}>
      {children}
    </h2>
  )
}

function SectionDesc({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p style={{
      fontSize:  '16px',
      lineHeight: 1.7,
      color:     '#64748B',
      margin:    '0 0 56px',
      textAlign: center ? 'center' : 'left',
      maxWidth:  center ? '560px' : undefined,
      marginLeft:center ? 'auto' : undefined,
      marginRight:center ? 'auto' : undefined,
    }}>
      {children}
    </p>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    title:  'Dashboard ao vivo',
    desc:   'Métricas de estoque, valor total e alertas que atualizam a cada movimentação — sem precisar dar refresh na página.',
    accent: '#2563EB',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
    title:  'Baixa em 2 cliques',
    desc:   'Busque o produto por nome, SKU ou código de barras. Confirme a quantidade e pronto — estoque atualizado em segundos.',
    accent: '#10B981',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    title:  'Multi-usuário',
    desc:   'Cada colaborador com seu nível de acesso — visualizador, editor ou admin. Controle quem pode fazer o quê.',
    accent: '#8B5CF6',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    title:  'Fluxo de caixa integrado',
    desc:   'Entradas e saídas de estoque geram lançamentos financeiros automaticamente. Sem double entry, sem planilha paralela.',
    accent: '#F59E0B',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
    title:  'Alertas de estoque baixo',
    desc:   'Configure o estoque mínimo por produto. O sistema avisa quando o nível crítico for atingido — antes de faltar.',
    accent: '#EF4444',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title:  'Audit log completo',
    desc:   'Rastreie cada ação: quem fez o quê, quando e em qual produto. Ideal para conformidade e auditorias internas.',
    accent: '#0EA5E9',
  },
]

function FeaturesSection() {
  return (
    <Section id="features" style={{ background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <SectionLabel>Funcionalidades</SectionLabel>
        <SectionTitle center>Tudo que sua operação precisa</SectionTitle>
        <SectionDesc center>
          Do cadastro ao relatório, o StockPro cobre o ciclo completo do estoque — sem complexidade desnecessária.
        </SectionDesc>
      </div>

      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap:                 '20px',
      }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="feature-card"
            style={{
              background:   '#fff',
              border:       '1px solid #E2E8F0',
              borderRadius: '16px',
              padding:      '28px',
            }}
          >
            <div style={{
              width:          '44px',
              height:         '44px',
              borderRadius:   '12px',
              background:     f.accent + '15',
              color:          f.accent,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              marginBottom:   '16px',
            }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize:'16px', fontWeight:700, color:'#0F172A', margin:'0 0 8px' }}>
              {f.title}
            </h3>
            <p style={{ fontSize:'14px', lineHeight:1.65, color:'#64748B', margin:0 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

type PricingPlan = {
  key:        string
  name:       string
  price:      string
  period:     string
  desc:       string
  color:      string
  highlight?: boolean
  features:   string[]
  cta:        string
}

const PLANS: PricingPlan[] = [
  {
    key:      'FREE',
    name:     'Essencial',
    price:    'R$0',
    period:   'para sempre',
    desc:     'Para quem está começando e precisa do básico com qualidade.',
    color:    '#64748B',
    features: [
      '1 usuário',
      '100 produtos cadastrados',
      'Dashboard em tempo real',
      'Movimentações de estoque',
      'Alertas de estoque baixo',
      '1 localização de estoque',
    ],
    cta: 'Começar grátis',
  },
  {
    key:       'PRO',
    name:      'Pro',
    price:     'R$149',
    period:    '/mês',
    desc:      'Para empresas em crescimento que precisam de controle total.',
    color:     '#2563EB',
    highlight: true,
    features: [
      '10 usuários',
      'Produtos ilimitados',
      'Tudo do Essencial',
      'Fluxo de caixa integrado',
      'Relatórios exportáveis',
      'Audit log completo',
      'Upload de fotos de produtos',
      'Movimentação rápida (Ctrl+K)',
      'Múltiplas localizações',
    ],
    cta: 'Começar com Pro',
  },
  {
    key:      'ENTERPRISE',
    name:     'Enterprise',
    price:    'Sob consulta',
    period:   '',
    desc:     'Para operações complexas com suporte dedicado e SLA garantido.',
    color:    '#0F172A',
    features: [
      'Usuários ilimitados',
      'Tudo do Pro',
      'SSO (SAML / OIDC)',
      'SLA garantido por contrato',
      'Suporte prioritário',
      'Onboarding dedicado',
      'Fatura mensal (boleto/PIX)',
      'Treinamento da equipe',
    ],
    cta: 'Falar com vendas',
  },
]

function PricingSection() {
  return (
    <Section id="pricing">
      <div style={{ textAlign: 'center' }}>
        <SectionLabel>Preços</SectionLabel>
        <SectionTitle center>Simples, sem surpresa</SectionTitle>
        <SectionDesc center>
          Comece grátis e escale quando precisar. Sem taxa de setup, sem fidelidade mínima.
        </SectionDesc>
      </div>

      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap:                 '24px',
        alignItems:          'start',
      }}>
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="pricing-card"
            style={{
              background:   '#fff',
              border:       plan.highlight ? `2px solid ${plan.color}` : '1px solid #E2E8F0',
              borderRadius: '20px',
              padding:      plan.highlight ? '32px' : '28px',
              position:     'relative',
              boxShadow:    plan.highlight ? `0 8px 32px ${plan.color}22` : 'none',
            }}
          >
            {plan.highlight && (
              <div style={{
                position:     'absolute',
                top:          '-13px',
                left:         '50%',
                transform:    'translateX(-50%)',
                background:   plan.color,
                color:        '#fff',
                fontSize:     '11px',
                fontWeight:   700,
                padding:      '4px 14px',
                borderRadius: '100px',
                letterSpacing:'0.5px',
                textTransform:'uppercase',
                whiteSpace:   'nowrap',
              }}>
                Mais popular
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize:'13px', fontWeight:600, color:plan.color, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                {plan.name}
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:6 }}>
                <span style={{ fontSize: plan.period ? '36px' : '24px', fontWeight:800, color:'#0F172A', letterSpacing:'-1px' }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ fontSize:'14px', color:'#94A3B8', fontWeight:500 }}>{plan.period}</span>
                )}
              </div>
              <p style={{ fontSize:'13px', color:'#64748B', margin:0, lineHeight:1.5 }}>
                {plan.desc}
              </p>
            </div>

            <Link
              href={
                plan.key === 'ENTERPRISE'
                  ? `mailto:sales@stockpro.com.br?subject=Enterprise`
                  : `${APP_URL}/register?plan=${plan.key}`
              }
              style={{
                display:        'block',
                textAlign:      'center',
                padding:        '11px 0',
                borderRadius:   '10px',
                fontWeight:     600,
                fontSize:       '14px',
                textDecoration: 'none',
                marginBottom:   '24px',
                background:     plan.highlight ? plan.color : 'transparent',
                color:          plan.highlight ? '#fff' : plan.color,
                border:         plan.highlight ? 'none' : `1.5px solid ${plan.color}`,
                transition:     'opacity 0.15s',
              }}
            >
              {plan.cta}
            </Link>

            <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:'20px' }}>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'10px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'13px', color:'#475569' }}>
                    <span style={{
                      flexShrink:     0,
                      width:          18,
                      height:         18,
                      borderRadius:   '50%',
                      background:     plan.color + '18',
                      color:          plan.color,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Trust note */}
      <p style={{ textAlign:'center', marginTop:'40px', fontSize:'13px', color:'#94A3B8' }}>
        Todos os planos incluem SSL, backups diários e suporte por e-mail.
        Cancele quando quiser, sem multa.
      </p>
    </Section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Preciso instalar algum software?',
    a: 'Não. O StockPro é 100% web — acesse pelo navegador de qualquer dispositivo. Nenhuma instalação, nenhuma atualização manual. Seus dados ficam na nuvem e são acessíveis de onde você estiver.',
  },
  {
    q: 'Posso importar meu catálogo de produtos atual?',
    a: 'Sim. Oferecemos importação via planilha Excel ou CSV. Basta baixar nosso modelo, preencher com seus produtos (nome, SKU, preço, estoque inicial) e fazer o upload. A importação leva menos de 2 minutos para catálogos de até 10.000 produtos.',
  },
  {
    q: 'Como funciona o período de trial?',
    a: 'Todo novo cadastro inicia com 14 dias de trial no plano Pro, sem precisar cadastrar cartão. Ao final do trial, você escolhe continuar no Pro, fazer upgrade para Enterprise, ou usar o plano Essencial gratuitamente — sem perder nenhum dado cadastrado.',
  },
  {
    q: 'É possível ter múltiplos depósitos ou filiais?',
    a: 'Sim, a partir do plano Pro você pode criar quantas localizações de estoque precisar — depósitos, lojas, centros de distribuição. O sistema controla o saldo de cada produto por localização e permite transferências entre elas.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos cartão de crédito (Visa, Mastercard, Amex) pelo Stripe, com cobrança mensal automática. O plano Enterprise também pode ser faturado mensalmente por boleto ou PIX. Não cobramos taxa de setup ou valor de adesão.',
  },
  {
    q: 'Como cancelo minha assinatura?',
    a: 'Pelo próprio painel do StockPro, em Configurações → Assinatura. O cancelamento é imediato e sem burocracia. Você continua com acesso até o final do período já pago, e seus dados ficam disponíveis para exportação por 90 dias.',
  },
]

function FaqSection() {
  return (
    <Section id="faq" style={{ background: '#F8FAFC' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '0' }}>
          <SectionLabel>FAQ</SectionLabel>
          <SectionTitle center>Perguntas frequentes</SectionTitle>
          <SectionDesc center>
            Ainda tem dúvidas? Fale com a gente pelo chat ou mande um e-mail para{' '}
            <a href="mailto:suporte@stockpro.com.br" style={{ color: '#2563EB' }}>suporte@stockpro.com.br</a>.
          </SectionDesc>
        </div>

        <div>
          {FAQS.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <div className="faq-body">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section style={{
      background:    'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #2563EB 100%)',
      padding:       '80px 24px',
      textAlign:     'center',
    }}>
      <div style={{ maxWidth:'600px', margin:'0 auto' }}>
        <h2 style={{
          fontSize:     'clamp(28px, 4vw, 40px)',
          fontWeight:   800,
          letterSpacing:'-1px',
          color:        '#fff',
          margin:       '0 0 16px',
        }}>
          Pronto para controlar seu estoque de verdade?
        </h2>
        <p style={{ fontSize:'16px', color:'#BFDBFE', marginBottom:'36px' }}>
          Comece grátis hoje. Configure em menos de 5 minutos. Sem cartão de crédito.
        </p>
        <Link
          href={`${APP_URL}/register`}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '8px',
            background:     '#fff',
            color:          '#1D4ED8',
            fontWeight:     700,
            fontSize:       '15px',
            padding:        '14px 32px',
            borderRadius:   '10px',
            textDecoration: 'none',
            boxShadow:      '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          Criar conta grátis
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{
      background:  '#0F172A',
      color:       '#94A3B8',
      padding:     '56px 24px 40px',
    }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'40px', marginBottom:'48px' }}>
          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
              <div style={{ width:28, height:28, borderRadius:7, background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" fill="white" opacity="0.9"/>
                  <rect x="5" y="5" width="6" height="6" rx="1" fill="white"/>
                </svg>
              </div>
              <span style={{ fontWeight:700, fontSize:'16px', color:'#F8FAFC' }}>StockPro</span>
            </div>
            <p style={{ fontSize:'13px', lineHeight:1.7, marginBottom:'16px', maxWidth:'240px' }}>
              Gestão de estoque em tempo real para pequenas e médias empresas brasileiras.
            </p>
            <p style={{ fontSize:'11px', color:'#475569', margin:0 }}>
              CNPJ 00.000.000/0001-00
            </p>
          </div>

          {/* Produto */}
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#E2E8F0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'16px' }}>
              Produto
            </div>
            <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label: 'Funcionalidades', href: '#features' },
                { label: 'Preços',          href: '#pricing'  },
                { label: 'Changelog',       href: '/changelog'},
                { label: 'Roadmap',         href: '/roadmap'  },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} style={{ fontSize:'13px', color:'#64748B', textDecoration:'none', transition:'color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#E2E8F0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'16px' }}>
              Empresa
            </div>
            <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label: 'Sobre nós',  href: '/sobre'   },
                { label: 'Blog',       href: '/blog'    },
                { label: 'Contato',    href: '/contato' },
                { label: 'Parceiros',  href: '/parceiros'},
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} style={{ fontSize:'13px', color:'#64748B', textDecoration:'none', transition:'color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#E2E8F0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'16px' }}>
              Legal
            </div>
            <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label: 'Privacidade',      href: '/privacidade'   },
                { label: 'Termos de uso',    href: '/termos'        },
                { label: 'Política de cookies', href: '/cookies'   },
                { label: 'LGPD',             href: '/lgpd'          },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} style={{ fontSize:'13px', color:'#64748B', textDecoration:'none', transition:'color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop:     '1px solid rgba(255,255,255,0.06)',
          paddingTop:    '24px',
          display:       'flex',
          justifyContent:'space-between',
          alignItems:    'center',
          flexWrap:      'wrap',
          gap:           '12px',
        }}>
          <p style={{ fontSize:'12px', color:'#475569', margin:0 }}>
            © {new Date().getFullYear()} StockPro. Todos os direitos reservados.
          </p>
          <p style={{ fontSize:'12px', color:'#475569', margin:0 }}>
            Feito no Brasil 🇧🇷
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main>
      <HeroSection appUrl={APP_URL} />
      <FeaturesSection />
      <PricingSection />
      <FaqSection />
      <CtaBanner />
      <Footer />
    </main>
  )
}
