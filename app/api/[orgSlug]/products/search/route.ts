import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { orgSlug: string } },
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q    = searchParams.get('q')?.trim() ?? ''
    const take = Math.min(Number(searchParams.get('take') ?? '8'), 50)

    if (!q) return NextResponse.json({ products: [] })

    // Verify membership
    const membership = await prisma.orgMember.findFirst({
      where: { org: { slug: params.orgSlug }, userId: user.id, isActive: true },
      select: { orgId: true },
    })
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { orgId } = membership

    // ── Full-text search (GIN index) for queries >= 2 chars ──────────────────
    // Falls back to LIKE scan only for single-char or barcode exact-match cases.
    let productIds: string[] | null = null

    if (q.length >= 2) {
      try {
        const rows = await prisma.$queryRaw<{ id: string }[]>`
          SELECT p.id::text
          FROM products p
          WHERE p.org_id      = ${orgId}::uuid
            AND p.is_archived = false
            AND p.is_active   = true
            AND p.search_vector @@ plainto_tsquery('portuguese', ${q})
          ORDER BY ts_rank(p.search_vector, plainto_tsquery('portuguese', ${q})) DESC
          LIMIT ${take}
        `
        productIds = rows.map((r) => r.id)
      } catch {
        // search_vector column not yet migrated — fall through to LIKE search
        productIds = null
      }
    }

    // ── Fetch full product data (with relations) ──────────────────────────────
    const products = productIds !== null
      ? await prisma.product.findMany({
          where: {
            id: { in: productIds },
          },
          include: {
            category:     { select: { id: true, name: true, color: true } },
            tags:         { include: { tag: { select: { id: true, name: true, color: true } } } },
            productStock: {
              include: { location: { select: { id: true, name: true, isDefault: true } } },
            },
          },
          // Preserve FTS rank order
          orderBy: productIds.length
            ? undefined  // will be re-sorted below
            : { name: 'asc' },
        })
      : await prisma.product.findMany({
          where: {
            orgId,
            isArchived: false,
            isActive:   true,
            OR: [
              { name:        { contains: q, mode: 'insensitive' } },
              { sku:         { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { barcode: q },
            ],
          },
          include: {
            category:     { select: { id: true, name: true, color: true } },
            tags:         { include: { tag: { select: { id: true, name: true, color: true } } } },
            productStock: {
              include: { location: { select: { id: true, name: true, isDefault: true } } },
            },
          },
          take,
          orderBy: { name: 'asc' },
        })

    // Restore FTS rank order (Prisma IN query doesn't preserve order)
    const ordered =
      productIds !== null && productIds.length > 0
        ? productIds
            .map((id) => products.find((p) => p.id === id))
            .filter(Boolean) as typeof products
        : products

    return NextResponse.json({
      products: ordered.map((p) => ({
        id:              p.id,
        name:            p.name,
        sku:             p.sku,
        barcode:         p.barcode,
        description:     p.description,
        imageUrl:        p.imageUrl,
        unit:            p.unit,
        minStock:        p.minStock,
        maxStock:        p.maxStock,
        costPrice:       Number(p.costPrice),
        salePrice:       Number(p.salePrice),
        isActive:        p.isActive,
        categoryId:      p.categoryId,
        category:        p.category,
        tags:            p.tags.map((pt) => pt.tag.name),
        totalStock:      p.productStock.reduce((s, ps) => s + ps.quantity, 0),
        stockByLocation: p.productStock.map((ps) => ({
          locationId:   ps.locationId,
          locationName: ps.location.name,
          isDefault:    ps.location.isDefault,
          quantity:     ps.quantity,
        })),
      })),
    })
  } catch (err) {
    console.error('[products/search]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
