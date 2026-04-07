import { getOrgBySlug } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProductsClient } from './components/ProductsClient'
import type { SerializedProduct } from './components/ProductsClient'

const PER_PAGE = 15

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string }
  searchParams: {
    page?:     string
    filter?:   string
    category?: string
    stock?:    string
  }
}) {
  const { org }    = await getOrgBySlug(params.orgSlug)
  const page       = Math.max(1, Number(searchParams.page) || 1)
  const filter     = searchParams.filter   ?? 'all'
  const categoryParam = searchParams.category ?? ''
  const stockParam    = searchParams.stock    ?? ''

  // ── Base where clause ──
  const where: any = { orgId: org.id }

  if (filter === 'active')   { where.isActive = true;  where.isArchived = false }
  if (filter === 'inactive') { where.isActive = false; where.isArchived = false }
  if (filter === 'archived') { where.isArchived = true }
  if (filter === 'all')      { /* no additional filter */ }

  if (categoryParam) where.categoryId = categoryParam

  // ── No-movement filter (last 30 days) ──
  let noMovementFilter = false
  if (stockParam === 'no-movement') {
    noMovementFilter = true
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    where.NOT = {
      stockMovements: { some: { createdAt: { gte: thirtyDaysAgo } } },
    }
  }

  // ── Fetch data ──
  const [rawProducts, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category:    { select: { id: true, name: true, color: true } },
        tags:        { include: { tag: { select: { id: true, name: true, color: true } } } },
        productStock: { select: { quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:  PER_PAGE * 5, // over-fetch for client-side stock filter
      skip:  (page - 1) * PER_PAGE,
    }).catch(() => []),

    prisma.product.count({ where }).catch(() => 0),

    prisma.category.findMany({
      where:   { orgId: org.id },
      select:  { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    }).catch(() => []),
  ])

  // ── Serialize ──
  let serialized: SerializedProduct[] = rawProducts.map((p) => ({
    id:          p.id,
    name:        p.name,
    sku:         p.sku,
    barcode:     p.barcode     ?? null,
    description: p.description ?? null,
    imageUrl:    p.imageUrl    ?? null,
    costPrice:   Number(p.costPrice),
    salePrice:   Number(p.salePrice),
    unit:        p.unit,
    minStock:    p.minStock,
    maxStock:    p.maxStock    ?? null,
    isActive:    p.isActive,
    isArchived:  p.isArchived,
    categoryId:  p.categoryId  ?? null,
    category:    p.category    ?? null,
    tags:        p.tags.map((pt) => pt.tag.name),
    totalStock:  p.productStock.reduce((s, ps) => s + ps.quantity, 0),
  }))

  // ── Client-side stock filters (requires computed totalStock) ──
  if (stockParam === 'critical') {
    serialized = serialized.filter(
      (p) => p.minStock > 0 && p.totalStock <= p.minStock * 0.5,
    )
  } else if (stockParam === 'ok') {
    serialized = serialized.filter(
      (p) => p.minStock === 0 || p.totalStock > p.minStock,
    )
  }

  // ── Paginate after filtering ──
  const paginated = serialized.slice(0, PER_PAGE)

  return (
    <ProductsClient
      orgSlug={params.orgSlug}
      orgId={org.id}
      products={paginated}
      categories={categories}
      total={total}
      page={page}
      perPage={PER_PAGE}
      filter={filter}
      category={categoryParam}
      stock={stockParam}
    />
  )
}
