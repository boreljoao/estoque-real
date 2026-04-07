'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillingProps = {
  orgId:              string
  orgSlug:            string
  plan:               string
  subscriptionStatus: string
  trialEndsAt:        string | null
  currentPeriodEnd:   string | null
  maxProducts:        number
  maxUsers:           number
  productCount:       number
  memberCount:        number
  isOwner:            boolean
}

// ─── Plan definitions (mirrors STRIPE_PLANS, adds display info) ───────────────

const PLANS = [
  {
    key:         'FREE',
    name:        'Essencial',
    price:       'Grátis',
    period:      '',
    color:       '#6B7280',
    bg:          '#F9FAFB',
    features:    ['1 usuário', '100 produtos', 'Estoque básico', 'Dashboard em tempo real'],
    notIncluded: ['Fluxo de caixa', 'Relatórios', 'Audit log', 'Upload de imagens'],
  },
  {
    key:         'PRO',
    name:        'Pro',
    price:       'R$ 99',
    period:      '/mês',
    color:       '#FF6B2C',
    bg:          '#FFF8F5',
    highlight:   true,
    features:    ['10 usuários', 'Produtos ilimitados', 'Estoque avançado', 'Fluxo de caixa', 'Relatórios', 'Audit log', 'Upload de imagens', 'Movimentação rápida (Ctrl+K)'],
    notIncluded: ['SSO', 'SLA garantido', 'Suporte prioritário'],
  },
  {
    key:         'ENTERPRISE',
    name:        'Enterprise',
    price:       'Sob consulta',
    period:      '',
    color:       '#1F2937',
    bg:          '#F3F4F6',
    features:    ['Usuários ilimitados', 'Tudo do Pro', 'SSO (SAML/OIDC)', 'SLA garantido', 'Suporte prioritário', 'Onboarding dedicado', 'Fatura mensal'],
    notIncluded: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function UsageBar({ current, max, label }: { current: number; max: number; label: string }) {
  const pct     = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const isHigh  = pct >= 90
  const isMed   = pct >= 70 && !isHigh
  const barColor = isHigh ? '#E53935' : isMed ? '#E65100' : '#2E7D32'

  return (
    <div className="billing-usage-item">
      <div className="billing-usage-header">
        <span className="billing-usage-label">{label}</span>
        <span className="billing-usage-count" style={{ color: barColor }}>
          {current.toLocaleString('pt-BR')}
          {max < 999999 ? ` / ${max.toLocaleString('pt-BR')}` : ' / Ilimitado'}
        </span>
      </div>
      <div className="billing-usage-track">
        <div
          className="billing-usage-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  isOwner,
  orgId,
  orgSlug,
  hasSubscription,
}: {
  plan:            typeof PLANS[0]
  isCurrent:       boolean
  isOwner:         boolean
  orgId:           string
  orgSlug:         string
  hasSubscription: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    if (!isOwner) return
    setLoading(true)
    try {
      if (plan.key === 'ENTERPRISE') {
        window.location.href = `mailto:sales@stockpro.app?subject=Enterprise%20-%20${orgSlug}`
        return
      }
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orgId, plan: plan.key }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  async function handleManage() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/portal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orgId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`billing-plan-card${plan.highlight ? ' highlight' : ''}${isCurrent ? ' current' : ''}`}
         style={{ '--plan-color': plan.color, '--plan-bg': plan.bg } as React.CSSProperties}>
      {plan.highlight && !isCurrent && (
        <div className="billing-plan-badge">Mais popular</div>
      )}
      {isCurrent && (
        <div className="billing-plan-badge current">Plano atual</div>
      )}

      <div className="billing-plan-name" style={{ color: plan.color }}>{plan.name}</div>
      <div className="billing-plan-price">
        <span className="billing-plan-price-val">{plan.price}</span>
        {plan.period && <span className="billing-plan-price-per">{plan.period}</span>}
      </div>

      <ul className="billing-plan-features">
        {plan.features.map((f) => (
          <li key={f} className="billing-plan-feature">
            <span className="billing-feature-check">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            {f}
          </li>
        ))}
        {plan.notIncluded.map((f) => (
          <li key={f} className="billing-plan-feature not-included">
            <span className="billing-feature-x">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </span>
            {f}
          </li>
        ))}
      </ul>

      {isOwner && (
        <div className="billing-plan-action">
          {isCurrent ? (
            hasSubscription ? (
              <button className="billing-btn ghost" onClick={handleManage} disabled={loading}>
                {loading ? 'Abrindo…' : 'Gerenciar assinatura'}
              </button>
            ) : (
              <span className="billing-current-label">Plano gratuito</span>
            )
          ) : plan.key === 'FREE' ? (
            <span className="billing-current-label" style={{ color: '#9CA3AF' }}>Downgrade via portal</span>
          ) : (
            <button className="billing-btn primary" style={{ '--btn-color': plan.color } as React.CSSProperties} onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Abrindo…' : plan.key === 'ENTERPRISE' ? 'Falar com vendas' : 'Fazer upgrade'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BillingSection({
  orgId,
  orgSlug,
  plan,
  subscriptionStatus,
  trialEndsAt,
  currentPeriodEnd,
  maxProducts,
  maxUsers,
  productCount,
  memberCount,
  isOwner,
}: BillingProps) {
  const hasSubscription = !!currentPeriodEnd
  const trialDaysLeft   = trialEndsAt ? daysUntil(trialEndsAt) : 0

  const statusLabel: Record<string, { label: string; badge: string }> = {
    ACTIVE:     { label: 'Ativo',               badge: 'ok'      },
    TRIALING:   { label: 'Trial',               badge: 'warning' },
    PAST_DUE:   { label: 'Pagamento pendente',  badge: 'critical'},
    CANCELED:   { label: 'Cancelado',           badge: 'neutral' },
    INCOMPLETE: { label: 'Incompleto',          badge: 'neutral' },
    PAUSED:     { label: 'Pausado',             badge: 'neutral' },
  }

  const statusInfo = statusLabel[subscriptionStatus] ?? { label: subscriptionStatus, badge: 'neutral' }

  return (
    <div className="dash-settings-section">
      <div className="dash-settings-title">Assinatura e Faturamento</div>
      <div className="dash-settings-desc">Gerencie seu plano, uso e pagamentos</div>

      {/* ── Current plan summary ── */}
      <div className="billing-summary">
        <div className="billing-summary-left">
          <div className="billing-summary-plan">
            <span className="billing-plan-pill" style={{ background: PLANS.find(p => p.key === plan)?.color + '22', color: PLANS.find(p => p.key === plan)?.color }}>
              {PLANS.find(p => p.key === plan)?.name ?? plan}
            </span>
            <span className={`dash-badge ${statusInfo.badge}`}>{statusInfo.label}</span>
          </div>
          <div className="billing-summary-meta">
            {subscriptionStatus === 'TRIALING' && trialEndsAt && (
              trialDaysLeft > 0
                ? `Trial termina em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''} · ${formatDate(trialEndsAt)}`
                : 'Trial expirado'
            )}
            {subscriptionStatus === 'ACTIVE' && currentPeriodEnd && (
              `Próxima cobrança em ${formatDate(currentPeriodEnd)}`
            )}
            {subscriptionStatus === 'PAST_DUE' && (
              'Atualize seu método de pagamento para continuar'
            )}
          </div>
        </div>
      </div>

      {/* ── Usage bars ── */}
      <div className="billing-usage">
        <UsageBar current={productCount} max={maxProducts} label="Produtos" />
        <UsageBar current={memberCount}  max={maxUsers}    label="Usuários"  />
      </div>

      {/* ── Plan comparison table ── */}
      <div className="billing-plans-grid">
        {PLANS.map((p) => (
          <PlanCard
            key={p.key}
            plan={p}
            isCurrent={plan === p.key}
            isOwner={isOwner}
            orgId={orgId}
            orgSlug={orgSlug}
            hasSubscription={hasSubscription}
          />
        ))}
      </div>
    </div>
  )
}
