'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { DashboardMetricsResponse } from '@/app/api/[orgSlug]/dashboard/metrics/route'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LowStockItem = {
  id: string
  name: string
  sku: string
  qty: number
  minStock: number
}

type Props = {
  orgId: string
  orgSlug: string
  totalProducts: number
  initialStockValue: number
  initialTodayMovements: number
  initialLowStockItems: LowStockItem[]
}

type RealtimeStatus = 'connecting' | 'live' | 'offline'

// Supabase postgres_changes INSERT payload (raw DB row, snake_case)
type MovementRow = {
  id: string
  org_id: string
  product_id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN'
  quantity: number
  unit_cost: string | null
  stock_before: number
  stock_after: number
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000)     return `R$ ${(val / 1_000).toFixed(1)}K`
  return `R$ ${val.toFixed(2)}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RealtimeMetrics({
  orgId,
  orgSlug,
  totalProducts,
  initialStockValue,
  initialTodayMovements,
  initialLowStockItems,
}: Props) {
  const [stockValue, setStockValue]           = useState(initialStockValue)
  const [todayMovements, setTodayMovements]   = useState(initialTodayMovements)
  const [lowStockItems, setLowStockItems]     = useState<LowStockItem[]>(initialLowStockItems)
  const [status, setStatus]                   = useState<RealtimeStatus>('connecting')
  const [flashMetric, setFlashMetric]         = useState<string | null>(null)
  const refetchTimerRef                       = useRef<ReturnType<typeof setTimeout>>()

  // Debounced refetch of server-computed metrics (lowStock + stockValue)
  const scheduleRefetch = useCallback(() => {
    clearTimeout(refetchTimerRef.current)
    refetchTimerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/${orgSlug}/dashboard/metrics`)
        if (!res.ok) return
        const data: DashboardMetricsResponse = await res.json()
        setStockValue(data.stockValue)
        setLowStockItems(data.lowStockItems)
      } catch {
        // silent — optimistic values already shown
      }
    }, 800) // wait 800ms so batch movements settle
  }, [orgSlug])

  const flash = (id: string) => {
    setFlashMetric(id)
    setTimeout(() => setFlashMetric(null), 600)
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel(`org-metrics-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          const row = payload.new as MovementRow

          // 1. Always increment today's counter
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (new Date(row.created_at) >= today) {
            setTodayMovements((n) => n + 1)
            flash('movements')
          }

          // 2. Optimistic stockValue delta (if unit_cost is present)
          if (row.unit_cost != null) {
            const costPerUnit = Number(row.unit_cost)
            const delta       = (row.stock_after - row.stock_before) * costPerUnit
            setStockValue((v) => Math.max(0, v + delta))
            flash('value')
          }

          // 3. Refetch accurate server values after debounce
          scheduleRefetch()
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED')   setStatus('live')
        if (channelStatus === 'CLOSED')       setStatus('offline')
        if (channelStatus === 'CHANNEL_ERROR') setStatus('offline')
      })

    return () => {
      clearTimeout(refetchTimerRef.current)
      supabase.removeChannel(channel)
    }
  }, [orgId, scheduleRefetch])

  const lowCount = lowStockItems.length

  return (
    <>
      {/* ── Live indicator ── */}
      <div className="rtm-status-row">
        <span className={`rtm-status-dot ${status}`} />
        <span className="rtm-status-label">
          {status === 'live'       ? 'Ao vivo'    :
           status === 'offline'   ? 'Offline'    : 'Conectando…'}
        </span>
      </div>

      {/* ── 4 metric cards ── */}
      <div className="dash-metrics">
        {/* Total Produtos — static, doesn't change from movements */}
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Total Produtos</span>
            <div className="dash-metric-icon orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
          <div className="dash-metric-value">{totalProducts.toLocaleString('pt-BR')}</div>
        </div>

        {/* Estoque Baixo */}
        <div className={`dash-metric-card${flashMetric === 'lowstock' ? ' rtm-flash' : ''}`}>
          <div className="dash-metric-header">
            <span className="dash-metric-label">Estoque Baixo</span>
            <div className="dash-metric-icon red">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
          <div className="dash-metric-value">{lowCount}</div>
          {lowCount > 0 && <span className="dash-metric-change down">Requer atenção</span>}
        </div>

        {/* Movimentações Hoje */}
        <div className={`dash-metric-card${flashMetric === 'movements' ? ' rtm-flash' : ''}`}>
          <div className="dash-metric-header">
            <span className="dash-metric-label">Movimentações Hoje</span>
            <div className="dash-metric-icon blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
              </svg>
            </div>
          </div>
          <div className="dash-metric-value">{todayMovements}</div>
        </div>

        {/* Valor em Estoque */}
        <div className={`dash-metric-card${flashMetric === 'value' ? ' rtm-flash' : ''}`}>
          <div className="dash-metric-header">
            <span className="dash-metric-label">Valor em Estoque</span>
            <div className="dash-metric-icon green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
          </div>
          <div className="dash-metric-value">{formatCurrency(stockValue)}</div>
        </div>
      </div>

      {/* ── Critical stock panel ── */}
      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <span className="dash-table-title">Estoque Crítico</span>
          {lowCount > 0 && (
            <span className="dash-badge critical">{lowCount} produto{lowCount > 1 ? 's' : ''}</span>
          )}
        </div>
        {lowCount > 0 ? (
          <div style={{ padding: '12px' }}>
            {lowStockItems.slice(0, 5).map((p) => {
              const isCritical = p.qty <= p.minStock * 0.5
              return (
                <div key={p.id} className="dash-alert-item">
                  <div className={`dash-alert-dot ${isCritical ? 'red' : 'yellow'}`} />
                  <div style={{ flex: 1 }}>
                    <div className="dash-alert-title">{p.name}</div>
                    <div className="dash-alert-desc">{p.sku} · {p.qty}/{p.minStock} un</div>
                  </div>
                  <span className={`dash-badge ${isCritical ? 'critical' : 'warning'}`}>
                    {isCritical ? 'Crítico' : 'Atenção'}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="dash-empty-title">Tudo em dia</div>
            <div className="dash-empty-desc">Nenhum produto com estoque baixo.</div>
          </div>
        )}
      </div>
    </>
  )
}
