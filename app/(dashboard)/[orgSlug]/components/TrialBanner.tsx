'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  orgId:              string
  orgSlug:            string
  subscriptionStatus: string
  trialEndsAt:        string | null  // ISO string or null
  plan:               string
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

export function TrialBanner({ orgId, orgSlug, subscriptionStatus, trialEndsAt, plan }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const isTrialing = subscriptionStatus === 'TRIALING'
  const isPastDue  = subscriptionStatus === 'PAST_DUE'

  if (!isTrialing && !isPastDue) return null

  const daysLeft = trialEndsAt ? daysUntil(trialEndsAt) : 0

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orgId, plan: 'PRO' }),
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
    <div className={`trial-banner ${isPastDue ? 'past-due' : 'trialing'}`}>
      <div className="trial-banner-left">
        {isPastDue ? (
          <>
            <span className="trial-banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <span className="trial-banner-text">
              <strong>Pagamento pendente.</strong> Atualize seu método de pagamento para continuar usando o StockPro.
            </span>
          </>
        ) : (
          <>
            <span className="trial-banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <span className="trial-banner-text">
              {daysLeft > 0
                ? <><strong>Seu trial termina em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}.</strong> Assine para continuar com acesso completo.</>
                : <><strong>Seu trial expirou.</strong> Assine para continuar usando o StockPro.</>
              }
            </span>
          </>
        )}
      </div>
      <div className="trial-banner-right">
        {isPastDue ? (
          <button className="trial-banner-btn danger" onClick={handleManage} disabled={loading}>
            {loading ? 'Abrindo…' : 'Atualizar pagamento'}
          </button>
        ) : (
          <>
            <button
              className="trial-banner-btn ghost"
              onClick={() => router.push(`/${orgSlug}/settings`)}
            >
              Ver planos
            </button>
            <button className="trial-banner-btn primary" onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Abrindo…' : 'Assinar agora'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
