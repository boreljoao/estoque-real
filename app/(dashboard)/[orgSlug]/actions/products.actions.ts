'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { withLimitLock, LimitError, limitReachedPayload } from '@/lib/plan-limits'
import type { LimitReachedPayload } from '@/lib/plan-limits'
import { assertRateLimit } from '@/lib/rate-limit'
import { sanitizeText, sanitizeTextNullable } from '@/lib/sanitize'

const productSchema = z.object({
  name:        z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  sku:         z.string().trim().min(1, 'SKU é obrigatório').max(100, 'SKU muito longo'),
  barcode:     z.string().trim().max(100).optional().nullable(),
  categoryId:  z.string().uuid().optional().nullable(),
  costPrice:   z.coerce.number().min(0).max(999_999_999).default(0),
  salePrice:   z.coerce.number().min(0).max(999_999_999).default(0),
  unit:        z.string().trim().max(20).default('un'),
  minStock:    z.coerce.number().int().min(0).max(9_999_999).default(0),
  maxStock:    z.coerce.number().int().min(0).max(9_999_999).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl:    z.string().url().max(500).optional().nullable(),
  tags:        z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  isActive:    z.boolean().default(true),
})

type ProductInput = z.infer<typeof productSchema>
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }
  | LimitReachedPayload

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function upsertTags(orgId: string, tagNames: string[]) {
  if (tagNames.length === 0) return []
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { orgId_name: { orgId, name } },
        update: {},
        create: { orgId, name },
        select: { id: true },
      }),
    ),
  )
  return tags.map((t) => t.id)
}

// ─── createProduct ────────────────────────────────────────────────────────────

export async function createProduct(
  orgSlug: string,
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')
    await assertRateLimit('action', userId)

    const parsed = productSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const data = parsed.data

    // Upsert tags outside the transaction (idempotent, no limit concerns)
    const tagIds = await upsertTags(orgId, data.tags)

    // Atomic: lock org row → check limit → check SKU → create product
    const product = await prisma.$transaction(async (tx) => {
      await withLimitLock(tx, orgId, 'products')

      const existing = await tx.product.findUnique({
        where: { orgId_sku: { orgId, sku: data.sku } },
        select: { id: true },
      })
      if (existing) {
        throw new Error(`SKU_TAKEN:${data.sku}`)
      }

      return tx.product.create({
        data: {
          orgId,
          name:        sanitizeText(data.name)!,
          sku:         sanitizeText(data.sku)!,
          barcode:     sanitizeTextNullable(data.barcode),
          categoryId:  data.categoryId  ?? undefined,
          costPrice:   data.costPrice,
          salePrice:   data.salePrice,
          unit:        sanitizeText(data.unit) ?? 'un',
          minStock:    data.minStock,
          maxStock:    data.maxStock    ?? undefined,
          description: sanitizeTextNullable(data.description),
          imageUrl:    data.imageUrl    ?? undefined,
          isActive:    data.isActive,
          createdById: userId,
          tags: tagIds.length > 0
            ? { create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
      })
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'CREATED',
      entityType: 'Product',
      entityId: product.id,
      after: product,
    })

    revalidatePath(`/${orgSlug}/products`)
    return { success: true, data: { id: product.id } }
  } catch (err) {
    if (err instanceof LimitError) return limitReachedPayload(err)
    if (err instanceof Error && err.message.startsWith('SKU_TAKEN:')) {
      const sku = err.message.slice('SKU_TAKEN:'.length)
      return { success: false, error: `SKU "${sku}" já está em uso nesta organização.` }
    }
    console.error('[createProduct]', { error: err instanceof Error ? err.message : String(err), orgSlug, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao criar produto.' }
  }
}

// ─── updateProduct ────────────────────────────────────────────────────────────

export async function updateProduct(
  orgSlug: string,
  productId: string,
  input: Partial<ProductInput>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')

    const parsed = productSchema.partial().safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const data = parsed.data

    const before = await prisma.product.findFirst({
      where: { id: productId, orgId },
    })
    if (!before) return { success: false, error: 'Produto não encontrado.' }

    // Check SKU uniqueness if changing it
    if (data.sku && data.sku !== before.sku) {
      const existing = await prisma.product.findUnique({
        where: { orgId_sku: { orgId, sku: data.sku } },
        select: { id: true },
      })
      if (existing) {
        return { success: false, error: `SKU "${data.sku}" já está em uso nesta organização.` }
      }
    }

    // Sync tags
    let tagOps: object | undefined
    if (data.tags !== undefined) {
      const tagIds = await upsertTags(orgId, data.tags)
      tagOps = {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      }
    }

    const after = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name        !== undefined && { name:        sanitizeText(data.name)! }),
        ...(data.sku         !== undefined && { sku:         sanitizeText(data.sku)! }),
        ...(data.barcode     !== undefined && { barcode:     sanitizeTextNullable(data.barcode) }),
        ...(data.categoryId  !== undefined && { categoryId:  data.categoryId  ?? null }),
        ...(data.costPrice   !== undefined && { costPrice:   data.costPrice }),
        ...(data.salePrice   !== undefined && { salePrice:   data.salePrice }),
        ...(data.unit        !== undefined && { unit:        sanitizeText(data.unit) ?? 'un' }),
        ...(data.minStock    !== undefined && { minStock:    data.minStock }),
        ...(data.maxStock    !== undefined && { maxStock:    data.maxStock    ?? null }),
        ...(data.description !== undefined && { description: sanitizeTextNullable(data.description) }),
        ...(data.imageUrl    !== undefined && { imageUrl:    data.imageUrl    ?? null }),
        ...(data.isActive    !== undefined && { isActive:    data.isActive }),
        updatedById: userId,
        ...(tagOps ? { tags: tagOps } : {}),
      },
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'UPDATED',
      entityType: 'Product',
      entityId: productId,
      before,
      after,
    })

    revalidatePath(`/${orgSlug}/products`)
    return { success: true, data: { id: productId } }
  } catch (err) {
    console.error('[updateProduct]', { error: err instanceof Error ? err.message : String(err), orgSlug, productId, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao atualizar produto.' }
  }
}

// ─── archiveProduct ───────────────────────────────────────────────────────────

export async function archiveProduct(
  orgSlug: string,
  productId: string,
): Promise<ActionResult> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')

    const before = await prisma.product.findFirst({
      where: { id: productId, orgId },
    })
    if (!before) return { success: false, error: 'Produto não encontrado.' }
    if (before.isArchived) return { success: false, error: 'Produto já está arquivado.' }

    const after = await prisma.product.update({
      where: { id: productId },
      data: { isArchived: true, updatedById: userId },
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'DELETED',
      entityType: 'Product',
      entityId: productId,
      before,
      after,
    })

    revalidatePath(`/${orgSlug}/products`)
    return { success: true, data: null }
  } catch (err) {
    console.error('[archiveProduct]', { error: err instanceof Error ? err.message : String(err), orgSlug, productId, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao arquivar produto.' }
  }
}

// ─── restoreProduct ───────────────────────────────────────────────────────────

export async function restoreProduct(
  orgSlug: string,
  productId: string,
): Promise<ActionResult> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')

    const before = await prisma.product.findFirst({
      where: { id: productId, orgId },
    })
    if (!before) return { success: false, error: 'Produto não encontrado.' }
    if (!before.isArchived) return { success: false, error: 'Produto não está arquivado.' }

    const after = await prisma.$transaction(async (tx) => {
      await withLimitLock(tx, orgId, 'products')
      return tx.product.update({
        where: { id: productId },
        data: { isArchived: false, updatedById: userId },
      })
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'RESTORED',
      entityType: 'Product',
      entityId: productId,
      before,
      after,
    })

    revalidatePath(`/${orgSlug}/products`)
    return { success: true, data: null }
  } catch (err) {
    if (err instanceof LimitError) return limitReachedPayload(err)
    console.error('[restoreProduct]', { error: err instanceof Error ? err.message : String(err), orgSlug, productId, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao restaurar produto.' }
  }
}
