'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { sanitizeText, sanitizeTextNullable } from '@/lib/sanitize'

const categorySchema = z.object({
  name:        z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().trim().max(500).optional().nullable(),
  color:       z.string().trim().max(20).optional().nullable(),
  parentId:    z.string().uuid().optional().nullable(),
  sortOrder:   z.coerce.number().int().min(0).max(9999).default(0),
})

type CategoryInput = z.infer<typeof categorySchema>
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createCategory(
  orgSlug: string,
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')

    const parsed = categorySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const data = parsed.data

    // Check name uniqueness within org
    const existing = await prisma.category.findUnique({
      where: { orgId_name: { orgId, name: data.name } },
      select: { id: true },
    })
    if (existing) {
      return { success: false, error: `Categoria "${data.name}" já existe nesta organização.` }
    }

    // Validate parent belongs to same org
    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, orgId },
        select: { id: true },
      })
      if (!parent) {
        return { success: false, error: 'Categoria pai não encontrada.' }
      }
    }

    const category = await prisma.category.create({
      data: {
        orgId,
        name:        sanitizeText(data.name)!,
        description: sanitizeTextNullable(data.description),
        color:       data.color ?? undefined,
        parentId:    data.parentId ?? undefined,
        sortOrder:   data.sortOrder,
      },
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'CREATED',
      entityType: 'Category',
      entityId: category.id,
      after: category,
    })

    revalidatePath(`/${orgSlug}/products`)
    return { success: true, data: { id: category.id } }
  } catch (err) {
    console.error('[createCategory]', { error: err instanceof Error ? err.message : String(err), orgSlug, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao criar categoria.' }
  }
}

export async function updateCategory(
  orgSlug: string,
  categoryId: string,
  input: Partial<CategoryInput>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'EDITOR')

    const parsed = categorySchema.partial().safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const data = parsed.data

    const before = await prisma.category.findFirst({
      where: { id: categoryId, orgId },
    })
    if (!before) return { success: false, error: 'Categoria não encontrada.' }

    // Check name uniqueness if changing it
    if (data.name && data.name !== before.name) {
      const existing = await prisma.category.findUnique({
        where: { orgId_name: { orgId, name: data.name } },
        select: { id: true },
      })
      if (existing) {
        return { success: false, error: `Categoria "${data.name}" já existe nesta organização.` }
      }
    }

    // Validate parent belongs to same org and avoid circular reference
    if (data.parentId && data.parentId !== before.parentId) {
      if (data.parentId === categoryId) {
        return { success: false, error: 'Uma categoria não pode ser pai de si mesma.' }
      }
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, orgId },
        select: { id: true },
      })
      if (!parent) {
        return { success: false, error: 'Categoria pai não encontrada.' }
      }
    }

    const after = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name        !== undefined && { name:        sanitizeText(data.name)! }),
        ...(data.description !== undefined && { description: sanitizeTextNullable(data.description) }),
        ...(data.color       !== undefined && { color:       data.color       ?? null }),
        ...(data.parentId    !== undefined && { parentId:    data.parentId    ?? null }),
        ...(data.sortOrder   !== undefined && { sortOrder:   data.sortOrder }),
      },
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'UPDATED',
      entityType: 'Category',
      entityId: categoryId,
      before,
      after,
    })

    revalidatePath(`/${orgSlug}/products`)
    return { success: true, data: { id: categoryId } }
  } catch (err) {
    console.error('[updateCategory]', { error: err instanceof Error ? err.message : String(err), orgSlug, categoryId, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao atualizar categoria.' }
  }
}

export async function deleteCategory(
  orgSlug: string,
  categoryId: string,
): Promise<ActionResult> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'ADMIN')

    const category = await prisma.category.findFirst({
      where: { id: categoryId, orgId },
      include: {
        _count: { select: { products: true, children: true } },
      },
    })
    if (!category) return { success: false, error: 'Categoria não encontrada.' }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `Não é possível excluir: ${category._count.products} produto(s) usam esta categoria.`,
      }
    }

    if (category._count.children > 0) {
      return {
        success: false,
        error: `Não é possível excluir: esta categoria tem ${category._count.children} subcategoria(s).`,
      }
    }

    await prisma.category.delete({ where: { id: categoryId } })

    await createAuditLog({
      orgId,
      userId,
      action: 'DELETED',
      entityType: 'Category',
      entityId: categoryId,
      before: category,
    })

    revalidatePath(`/${orgSlug}/products`)
    return { success: true, data: null }
  } catch (err) {
    console.error('[deleteCategory]', { error: err instanceof Error ? err.message : String(err), orgSlug, categoryId, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao excluir categoria.' }
  }
}
