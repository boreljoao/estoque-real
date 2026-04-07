import { unstable_cache } from 'next/cache'
import { getOrgBySlug } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { RealtimeMetrics } from './components/RealtimeMetrics'
import { RealtimeMovementsFeed } from './components/RealtimeMovementsFeed'
import { WelcomeToast } from './components/WelcomeToast'
import type { LowStockItem } from './components/RealtimeMetrics'
import type { FeedMovement } from './components/RealtimeMovementsFeed'

// ─── Types for raw SQL results ────────────────────────────────────────────────

type StockSummaryRow = {
  total_value:     number
  total_products:  number
  low_stock_count: number
}

type LowStockRow = {
  id:        string
  name:      string
  sku:       string
  min_stock: number
  total_qty: number
}

// ─── Aggregated org metrics (cached 30s per org) ──────────────────────────────

async function fetchOrgMetrics(orgId: string) {
  const [summaryRows, lowStockRows, todayMovements] = await Promise.all([
    prisma.$queryRaw<StockSummaryRow[]>`
      SELECT
        COALESCE(SUM(ps.quantity * p.cost_price), 0)::float8                                             AS total_value,
        COUNT(DISTINCT p.id)::int                                                                         AS total_products,
        COUNT(DISTINCT CASE WHEN ps.quantity <= p.min_stock AND p.min_stock > 0 THEN p.id END)::int       AS low_stock_count
      FROM products p
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      WHERE p.org_id = ${orgId}::uuid
        AND p.is_active = true
        AND p.is_archived = false
    `,

    prisma.$queryRaw<LowStockRow[]>`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.min_stock,
        COALESCE(SUM(ps.quantity), 0)::int AS total_qty
      FROM products p
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      WHERE p.org_id = ${orgId}::uuid
        AND p.is_active    = true
        AND p.is_archived  = false
        AND p.min_stock    > 0
      GROUP BY p.id, p.name, p.sku, p.min_stock
      HAVING COALESCE(SUM(ps.quantity), 0) <= p.min_stock
      ORDER BY total_qty ASC
      LIMIT 20
    `,

    prisma.stockMovement
      .count({
        where: {
          orgId,
          createdAt: { gte: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })() },
        },
      })
      .catch(() => 0),
  ])

  const summary = summaryRows[0] ?? { total_value: 0, total_products: 0, low_stock_count: 0 }

  const lowStockItems: LowStockItem[] = lowStockRows.map((r) => ({
    id:       r.id,
    name:     r.name,
    sku:      r.sku,
    qty:      Number(r.total_qty),
    minStock: Number(r.min_stock),
  }))

  return {
    totalProducts:   Number(summary.total_products),
    stockValue:      Number(summary.total_value),
    todayMovements,
    lowStockItems,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  params,
}: {
  params:       { orgSlug: string }
}) {
  const { org } = await getOrgBySlug(params.orgSlug)

  // Per-org cached metrics (30s TTL, invalidated by revalidateTag after movements)
  const metrics = await unstable_cache(
    () => fetchOrgMetrics(org.id),
    [`org-metrics-${org.id}`],
    { tags: [`org-metrics-${org.id}`], revalidate: 30 },
  )()

  const recentMovementsRaw = await prisma.stockMovement.findMany({
    where: { orgId: org.id },
    include: {
      product:     { select: { id: true, name: true, sku: true } },
      location:    { select: { id: true, name: true } },
      performedBy: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  }).catch(() => [])

  const initialMovements: FeedMovement[] = recentMovementsRaw.map((m) => ({
    id:          m.id,
    type:        m.type,
    quantity:    m.quantity,
    stockBefore: m.stockBefore,
    stockAfter:  m.stockAfter,
    createdAt:   m.createdAt.toISOString(),
    product:     { id: m.product.id,     name: m.product.name,                sku: m.product.sku },
    location:    { id: m.location.id,    name: m.location.name },
    performedBy: { id: m.performedBy.id, fullName: m.performedBy.fullName ?? null, email: m.performedBy.email },
  }))

  return (
    <>
      <div className="dash-header">
        <div className="dash-header-left">
          <div>
            <div className="dash-header-title">Dashboard</div>
            <div className="dash-header-sub">{org.name}</div>
          </div>
        </div>
        <div className="dash-header-right">
          <div className="dash-header-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            Buscar...
          </div>
          <div className="dash-header-icon-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {metrics.lowStockItems.length > 0 && <span className="dash-notification-dot" />}
          </div>
        </div>
      </div>

      <div className="dash-content">
        <RealtimeMetrics
          orgId={org.id}
          orgSlug={params.orgSlug}
          totalProducts={metrics.totalProducts}
          initialStockValue={metrics.stockValue}
          initialTodayMovements={metrics.todayMovements}
          initialLowStockItems={metrics.lowStockItems}
        />

        <div style={{ marginTop: 24 }}>
          <RealtimeMovementsFeed
            orgId={org.id}
            orgSlug={params.orgSlug}
            initialMovements={initialMovements}
          />
        </div>
      </div>

      <WelcomeToast />
    </>
  )
}
