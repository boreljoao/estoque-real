'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedMovement = {
  id: string
  type: string
  quantity: number
  stockBefore: number
  stockAfter: number
  createdAt: string
  product: { id: string; name: string; sku: string }
  location: { id: string; name: string }
  performedBy: { id: string; fullName: string | null; email: string }
}

type FeedItem = FeedMovement & { isNew?: boolean }

type MovementRow = {
  id: string
  org_id: string
  product_id: string
  location_id: string
  performed_by_id: string
  type: string
  quantity: number
  stock_before: number
  stock_after: number
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; badge: string; sign: string }> = {
  IN:         { label: 'Entrada',       badge: 'ok',       sign: '+' },
  OUT:        { label: 'Saída',         badge: 'critical', sign: '-' },
  TRANSFER:   { label: 'Transferência', badge: 'info',     sign: ''  },
  ADJUSTMENT: { label: 'Ajuste',        badge: 'warning',  sign: ''  },
  RETURN:     { label: 'Devolução',     badge: 'ok',       sign: '+' },
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 10)  return 'agora'
  if (seconds < 60)  return `há ${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60)     return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24)    return `há ${hours}h`
  return new Date(iso).toLocaleDateString('pt-BR')
}

const MAX_FEED = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function RealtimeMovementsFeed({
  orgId,
  orgSlug,
  initialMovements,
}: {
  orgId: string
  orgSlug: string
  initialMovements: FeedMovement[]
}) {
  const [items, setItems] = useState<FeedItem[]>(initialMovements)
  // Tick every 30s to re-render relative timestamps
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel(`org-feed-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements',
          filter: `org_id=eq.${orgId}`,
        },
        async (payload) => {
          const row = payload.new as MovementRow

          // Fetch enriched data: product name, location name, performer name
          const { data, error } = await supabase
            .from('stock_movements')
            .select(`
              id, type, quantity, stock_before, stock_after, created_at,
              product:products(id, name, sku),
              location:stock_locations(id, name),
              performed_by:profiles(id, full_name, email)
            `)
            .eq('id', row.id)
            .single()

          if (error || !data) return

          // PostgREST returns arrays for relations — normalize to single objects
          const product     = Array.isArray(data.product)      ? data.product[0]      : data.product
          const location    = Array.isArray(data.location)     ? data.location[0]     : data.location
          const performedBy = Array.isArray(data.performed_by) ? data.performed_by[0] : data.performed_by

          if (!product || !location || !performedBy) return

          const newItem: FeedItem = {
            id:          data.id,
            type:        data.type,
            quantity:    data.quantity,
            stockBefore: data.stock_before,
            stockAfter:  data.stock_after,
            createdAt:   data.created_at,
            product:     { id: product.id, name: product.name, sku: product.sku },
            location:    { id: location.id, name: location.name },
            performedBy: {
              id:       performedBy.id,
              fullName: performedBy.full_name ?? null,
              email:    performedBy.email,
            },
            isNew: true,
          }

          setItems((prev) => {
            const updated = [newItem, ...prev].slice(0, MAX_FEED)
            return updated
          })

          // Remove isNew flag after animation completes
          setTimeout(() => {
            setItems((prev) =>
              prev.map((item) => item.id === newItem.id ? { ...item, isNew: false } : item),
            )
          }, 600)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId])

  return (
    <div className="dash-table-wrap">
      <div className="dash-table-header">
        <span className="dash-table-title">Últimas Movimentações</span>
        <Link href={`/${orgSlug}/stock`} className="dash-btn dash-btn-ghost">Ver todas →</Link>
      </div>

      {items.length > 0 ? (
        <table className="dash-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Local</th>
              <th>Quando</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => {
              const meta = TYPE_META[m.type] ?? { label: m.type, badge: 'neutral', sign: '' }
              return (
                <tr key={m.id} className={m.isNew ? 'rtm-row-new' : ''}>
                  <td className="bold">{m.product.name}</td>
                  <td>
                    <span className={`dash-badge ${meta.badge}`}>{meta.label}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px',
                    color: meta.sign === '+' ? '#2E7D32' : meta.sign === '-' ? '#E53935' : '#444' }}>
                    {meta.sign}{m.quantity}
                  </td>
                  <td style={{ fontSize: '12px', color: '#888' }}>{m.location.name}</td>
                  <td style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap' }}>
                    {timeAgo(m.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div className="dash-empty">
          <div className="dash-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
            </svg>
          </div>
          <div className="dash-empty-title">Nenhuma movimentação</div>
          <div className="dash-empty-desc">Registre entradas e saídas para começar.</div>
          <Link href={`/${orgSlug}/stock`} className="dash-btn dash-btn-primary">
            Registrar movimentação
          </Link>
        </div>
      )}
    </div>
  )
}
