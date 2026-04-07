import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export type DashboardMetricsResponse = {
  stockValue: number
  lowStockItems: {
    id:       string
    name:     string
    sku:      string
    qty:      number
    minStock: number
  }[]
}

type StockSummaryRow = { total_value: number }
type LowStockRow     = { id: string; name: string; sku: string; min_stock: number; total_qty: number }

export async function GET(
  _request: Request,
  { params }: { params: { orgSlug: string } },
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await prisma.orgMember.findFirst({
      where: { org: { slug: params.orgSlug }, userId: user.id, isActive: true },
      select: { orgId: true },
    })
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { orgId } = membership

    const [summaryRows, lowStockRows] = await Promise.all([
      prisma.$queryRaw<StockSummaryRow[]>`
        SELECT COALESCE(SUM(ps.quantity * p.cost_price), 0)::float8 AS total_value
        FROM products p
        LEFT JOIN product_stock ps ON ps.product_id = p.id
        WHERE p.org_id = ${orgId}::uuid
          AND p.is_active   = true
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
          AND p.is_active   = true
          AND p.is_archived = false
          AND p.min_stock   > 0
        GROUP BY p.id, p.name, p.sku, p.min_stock
        HAVING COALESCE(SUM(ps.quantity), 0) <= p.min_stock
        ORDER BY total_qty ASC
        LIMIT 20
      `,
    ])

    const stockValue   = Number(summaryRows[0]?.total_value ?? 0)
    const lowStockItems = lowStockRows.map((r) => ({
      id:       r.id,
      name:     r.name,
      sku:      r.sku,
      qty:      Number(r.total_qty),
      minStock: Number(r.min_stock),
    }))

    return NextResponse.json({ stockValue, lowStockItems } satisfies DashboardMetricsResponse)
  } catch (err) {
    console.error('[dashboard/metrics]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
