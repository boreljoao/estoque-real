'use server'

import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { assertRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/emails/send'
import type { StockMovementType, CashFlowType } from '@stockpro/db'
import { sanitizeTextNullable } from '@/lib/sanitize'

const movementSchema = z.object({
  productId:      z.string().uuid('ID do produto inválido'),
  locationId:     z.string().uuid('ID da localização inválido'),
  type:           z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN']),
  quantity:       z.coerce.number().int().positive('Quantidade deve ser um inteiro positivo').max(9_999_999),
  reason:         z.string().trim().max(300).optional().nullable(),
  notes:          z.string().trim().max(1000).optional().nullable(),
  unitCost:       z.coerce.number().min(0).max(999_999_999).optional().nullable(),
  // Only for TRANSFER
  fromLocationId: z.string().uuid().optional().nullable(),
  toLocationId:   z.string().uuid().optional().nullable(),
})

type MovementInput = z.infer<typeof movementSchema>
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Internal: execute one leg of a movement inside a transaction ────────────
async function executeMovementLeg(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: {
    orgId: string
    userId: string
    productId: string
    locationId: string
    type: StockMovementType
    quantity: number
    reason?: string | null
    notes?: string | null
    unitCost?: number | null
  },
): Promise<{ movementId: string; stockBefore: number; stockAfter: number }> {
  const { orgId, userId, productId, locationId, type, quantity, reason, notes, unitCost } = params

  // Pessimistic lock: lock the product_stock row (or the product row as proxy
  // when no stock record exists yet) to prevent concurrent over-sell.
  type StockLockRow = { quantity: number }
  const locked = await tx.$queryRaw<StockLockRow[]>`
    SELECT quantity FROM product_stock
    WHERE product_id  = ${productId}::uuid
      AND location_id = ${locationId}::uuid
    FOR UPDATE
  `

  const stockBefore = locked.length > 0 ? locked[0].quantity : 0

  // Determine stock delta
  let delta: number
  if (type === 'IN' || type === 'RETURN') {
    delta = quantity
  } else if (type === 'OUT') {
    delta = -quantity
  } else if (type === 'ADJUSTMENT') {
    // quantity is the absolute new value for ADJUSTMENT
    delta = quantity - stockBefore
  } else {
    // TRANSFER legs are called with positive quantity, direction handled by caller
    delta = quantity
  }

  const stockAfter = stockBefore + delta

  if (stockAfter < 0) {
    throw new Error(
      `Estoque insuficiente. Disponível: ${stockBefore}, solicitado: ${quantity}.`,
    )
  }

  // Upsert ProductStock
  await tx.productStock.upsert({
    where: { productId_locationId: { productId, locationId } },
    create: { productId, locationId, quantity: stockAfter },
    update: { quantity: stockAfter },
  })

  const totalCost = unitCost != null ? quantity * unitCost : null

  // Create StockMovement record
  const movement = await tx.stockMovement.create({
    data: {
      orgId,
      productId,
      locationId,
      type,
      quantity,
      unitCost:  unitCost ?? undefined,
      totalCost: totalCost ?? undefined,
      reason:    sanitizeTextNullable(reason) ?? undefined,
      notes:     sanitizeTextNullable(notes) ?? undefined,
      stockBefore,
      stockAfter,
      performedById: userId,
    },
  })

  return { movementId: movement.id, stockBefore, stockAfter }
}

// ─── Internal: create automatic CashFlowEntry for IN/OUT movements ───────────
async function createAutoFlowEntry(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: {
    orgId: string
    userId: string
    movementId: string
    type: 'IN' | 'OUT'
    quantity: number
    unitCost: number | null
  },
) {
  const { orgId, userId, movementId, type, quantity, unitCost } = params
  if (unitCost == null || unitCost <= 0) return

  const amount = quantity * unitCost
  const flowType: CashFlowType = type === 'IN' ? 'EXPENSE' : 'INCOME'

  // Find or skip — no default category required
  await tx.cashFlowEntry.create({
    data: {
      orgId,
      type: flowType,
      amount,
      description: type === 'IN' ? 'Entrada de estoque (compra)' : 'Saída de estoque (venda)',
      occurredAt: new Date(),
      movementId,
      createdById: userId,
    },
  })
}

// ─── Low-stock alert helper ───────────────────────────────────────────────────
// Called fire-and-forget after createMovement. Checks if a product is now at or
// below its minStock and, if so, emails all OWNER/ADMIN members of the org.

async function checkLowStockAndAlert(
  orgId:     string,
  orgSlug:   string,
  productId: string,
): Promise<void> {
  // Fetch product + total stock + org owner/admins in one go
  const [product, members] = await Promise.all([
    prisma.product.findUnique({
      where:  { id: productId },
      select: {
        id:           true,
        name:         true,
        sku:          true,
        minStock:     true,
        productStock: { select: { quantity: true } },
      },
    }),
    prisma.orgMember.findMany({
      where:   { orgId, isActive: true, role: { in: ['OWNER', 'ADMIN'] } },
      include: { user: { select: { email: true } } },
    }),
  ])

  if (!product || product.minStock <= 0) return

  const totalStock = product.productStock.reduce((s, ps) => s + ps.quantity, 0)
  if (totalStock > product.minStock) return  // above threshold — no alert needed

  const adminEmails = members
    .map((m) => m.user.email)
    .filter(Boolean) as string[]
  if (!adminEmails.length) return

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.stockpro.com.br'
  const productsUrl = `${appUrl}/${orgSlug}/products?stock=critical`

  const org = await prisma.organization.findUnique({
    where:  { id: orgId },
    select: { name: true },
  }).catch(() => null)

  await sendEmail({
    template: 'low-stock',
    to:       adminEmails,
    data: {
      orgName:     org?.name ?? orgSlug,
      productsUrl,
      items: [{
        name:     product.name,
        sku:      product.sku,
        qty:      totalStock,
        minStock: product.minStock,
        url:      `${appUrl}/${orgSlug}/products`,
      }],
    },
  })
}

// ─── createMovement ───────────────────────────────────────────────────────────
export async function createMovement(
  orgSlug: string,
  input: MovementInput,
): Promise<ActionResult<{ movementId: string }>> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')
    await assertRateLimit('action', userId)

    const parsed = movementSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const data = parsed.data

    if (data.type === 'TRANSFER') {
      if (!data.fromLocationId || !data.toLocationId) {
        return {
          success: false,
          error: 'TRANSFER requer fromLocationId e toLocationId.',
        }
      }
      if (data.fromLocationId === data.toLocationId) {
        return {
          success: false,
          error: 'As localizações de origem e destino devem ser diferentes.',
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (data.type === 'TRANSFER') {
        // OUT from source
        const outLeg = await executeMovementLeg(tx, {
          orgId,
          userId,
          productId: data.productId,
          locationId: data.fromLocationId!,
          type: 'OUT' as StockMovementType,
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes,
          unitCost: data.unitCost,
        })

        // IN to destination
        await executeMovementLeg(tx, {
          orgId,
          userId,
          productId: data.productId,
          locationId: data.toLocationId!,
          type: 'IN' as StockMovementType,
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes,
          unitCost: data.unitCost,
        })

        return { movementId: outLeg.movementId }
      }

      const leg = await executeMovementLeg(tx, {
        orgId,
        userId,
        productId: data.productId,
        locationId: data.locationId,
        type: data.type as StockMovementType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
        unitCost: data.unitCost,
      })

      if (data.type === 'IN' || data.type === 'OUT') {
        await createAutoFlowEntry(tx, {
          orgId,
          userId,
          movementId: leg.movementId,
          type: data.type,
          quantity: data.quantity,
          unitCost: data.unitCost ?? null,
        })
      }

      return { movementId: leg.movementId }
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'STOCK_MOVED',
      entityType: 'StockMovement',
      entityId: result.movementId,
      after: { type: data.type, productId: data.productId, quantity: data.quantity },
    })

    revalidatePath(`/${orgSlug}/stock`)
    revalidatePath(`/${orgSlug}/products`)
    revalidatePath(`/${orgSlug}/cash-flow`)
    revalidateTag(`org-metrics-${orgId}`)

    // Fire-and-forget: check if this movement triggered a low-stock threshold
    checkLowStockAndAlert(orgId, orgSlug, data.productId).catch(() => {})

    return { success: true, data: { movementId: result.movementId } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao registrar movimentação.'
    console.error('[createMovement]', { error: message, orgSlug, timestamp: new Date().toISOString() })
    return { success: false, error: message }
  }
}

// ─── bulkMovement ─────────────────────────────────────────────────────────────
export async function bulkMovement(
  orgSlug: string,
  movements: MovementInput[],
): Promise<ActionResult<{ count: number }>> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')

    if (!movements.length) {
      return { success: false, error: 'Nenhuma movimentação fornecida.' }
    }

    const parsed = z.array(movementSchema).safeParse(movements)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const data = parsed.data
    const movementIds: string[] = []

    await prisma.$transaction(async (tx) => {
      for (const item of data) {
        if (item.type === 'TRANSFER') {
          if (!item.fromLocationId || !item.toLocationId) {
            throw new Error('TRANSFER requer fromLocationId e toLocationId.')
          }

          const outLeg = await executeMovementLeg(tx, {
            orgId,
            userId,
            productId: item.productId,
            locationId: item.fromLocationId,
            type: 'OUT' as StockMovementType,
            quantity: item.quantity,
            reason: item.reason,
            notes: item.notes,
            unitCost: item.unitCost,
          })
          movementIds.push(outLeg.movementId)

          await executeMovementLeg(tx, {
            orgId,
            userId,
            productId: item.productId,
            locationId: item.toLocationId,
            type: 'IN' as StockMovementType,
            quantity: item.quantity,
            reason: item.reason,
            notes: item.notes,
            unitCost: item.unitCost,
          })
        } else {
          const leg = await executeMovementLeg(tx, {
            orgId,
            userId,
            productId: item.productId,
            locationId: item.locationId,
            type: item.type as StockMovementType,
            quantity: item.quantity,
            reason: item.reason,
            notes: item.notes,
            unitCost: item.unitCost,
          })
          movementIds.push(leg.movementId)

          if (item.type === 'IN' || item.type === 'OUT') {
            await createAutoFlowEntry(tx, {
              orgId,
              userId,
              movementId: leg.movementId,
              type: item.type,
              quantity: item.quantity,
              unitCost: item.unitCost ?? null,
            })
          }
        }
      }
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'STOCK_MOVED',
      entityType: 'StockMovement',
      entityId: movementIds[0],
      after: { bulk: true, count: movementIds.length, movementIds },
    })

    revalidatePath(`/${orgSlug}/stock`)
    revalidatePath(`/${orgSlug}/products`)
    revalidatePath(`/${orgSlug}/cash-flow`)
    revalidateTag(`org-metrics-${orgId}`)
    return { success: true, data: { count: movementIds.length } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao registrar movimentações em lote.'
    console.error('[bulkMovement]', { error: message, orgSlug, timestamp: new Date().toISOString() })
    return { success: false, error: message }
  }
}
