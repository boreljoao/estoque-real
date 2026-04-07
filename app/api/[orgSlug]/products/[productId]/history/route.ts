import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export type ProductHistoryDay = {
  date:  string // YYYY-MM-DD
  in:    number
  out:   number
  net:   number
}

export type ProductHistoryResponse = {
  days:         ProductHistoryDay[]
  totalIn:      number
  totalOut:     number
  movementCount: number
}

export async function GET(
  request: Request,
  { params }: { params: { orgSlug: string; productId: string } },
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

    // Verify product belongs to this org
    const product = await prisma.product.findFirst({
      where: { id: params.productId, orgId },
      select: { id: true },
    })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const movements = await prisma.stockMovement.findMany({
      where: {
        productId: params.productId,
        orgId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { type: true, quantity: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Build 30-day map
    const dayMap = new Map<string, { in: number; out: number }>()
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      dayMap.set(key, { in: 0, out: 0 })
    }

    let totalIn  = 0
    let totalOut = 0

    for (const m of movements) {
      const key = m.createdAt.toISOString().slice(0, 10)
      const entry = dayMap.get(key)
      if (!entry) continue

      if (m.type === 'IN' || m.type === 'RETURN') {
        entry.in  += m.quantity
        totalIn   += m.quantity
      } else if (m.type === 'OUT') {
        entry.out += m.quantity
        totalOut  += m.quantity
      }
    }

    const days: ProductHistoryDay[] = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      in:  v.in,
      out: v.out,
      net: v.in - v.out,
    }))

    return NextResponse.json({
      days,
      totalIn,
      totalOut,
      movementCount: movements.length,
    } satisfies ProductHistoryResponse)
  } catch (err) {
    console.error('[products/history]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
