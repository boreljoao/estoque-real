'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireRole, getUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import type { MemberRole } from '@stockpro/db'

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

const ROLE_HIERARCHY: MemberRole[] = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']

function roleLevel(role: MemberRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

export async function updateMemberRole(
  orgSlug: string,
  memberId: string,
  newRole: MemberRole,
): Promise<ActionResult> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'ADMIN')

    const parsed = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']).safeParse(newRole)
    if (!parsed.success) {
      return { success: false, error: 'Role inválido.' }
    }

    // Get caller's role to enforce hierarchy
    const callerMember = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
      select: { role: true },
    })
    if (!callerMember) return { success: false, error: 'Membro não encontrado.' }

    const targetMember = await prisma.orgMember.findFirst({
      where: { id: memberId, orgId, isActive: true },
      select: { id: true, userId: true, role: true },
    })
    if (!targetMember) return { success: false, error: 'Membro não encontrado.' }

    // Cannot change own role
    if (targetMember.userId === userId) {
      return { success: false, error: 'Você não pode alterar sua própria role.' }
    }

    // ADMIN can only manage EDITOR/VIEWER — cannot touch OWNER or other ADMINs
    if (callerMember.role === 'ADMIN') {
      if (roleLevel(targetMember.role) >= roleLevel('ADMIN')) {
        return { success: false, error: 'ADMIN não pode alterar role de OWNER ou ADMIN.' }
      }
      if (roleLevel(newRole) >= roleLevel('ADMIN')) {
        return { success: false, error: 'ADMIN não pode promover um membro para ADMIN ou OWNER.' }
      }
    }

    // Only OWNER can promote to OWNER or change another OWNER's role
    if (newRole === 'OWNER' && callerMember.role !== 'OWNER') {
      return { success: false, error: 'Somente OWNER pode promover outro membro para OWNER.' }
    }

    const before = { role: targetMember.role }
    await prisma.orgMember.update({
      where: { id: memberId },
      data: { role: newRole },
    })
    const after = { role: newRole }

    await createAuditLog({
      orgId,
      userId,
      action: 'PERMISSION_CHANGED',
      entityType: 'OrgMember',
      entityId: memberId,
      before,
      after,
    })

    revalidatePath(`/${orgSlug}/users`)
    return { success: true, data: null }
  } catch (err) {
    console.error('[updateMemberRole]', { error: err instanceof Error ? err.message : String(err), orgSlug, memberId, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao atualizar role do membro.' }
  }
}

export async function removeMember(
  orgSlug: string,
  memberId: string,
): Promise<ActionResult> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'ADMIN')

    const callerMember = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
      select: { role: true },
    })
    if (!callerMember) return { success: false, error: 'Membro não encontrado.' }

    const targetMember = await prisma.orgMember.findFirst({
      where: { id: memberId, orgId, isActive: true },
      select: { id: true, userId: true, role: true },
    })
    if (!targetMember) return { success: false, error: 'Membro não encontrado.' }

    // OWNER cannot be removed
    if (targetMember.role === 'OWNER') {
      return { success: false, error: 'O OWNER da organização não pode ser removido.' }
    }

    // Cannot remove yourself
    if (targetMember.userId === userId) {
      return { success: false, error: 'Você não pode remover a si mesmo.' }
    }

    // ADMIN can only remove EDITOR/VIEWER
    if (callerMember.role === 'ADMIN' && roleLevel(targetMember.role) >= roleLevel('ADMIN')) {
      return { success: false, error: 'ADMIN não pode remover outro ADMIN.' }
    }

    await prisma.orgMember.update({
      where: { id: memberId },
      data: { isActive: false },
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'UPDATED',
      entityType: 'OrgMember',
      entityId: memberId,
      before: { isActive: true, role: targetMember.role },
      after: { isActive: false, role: targetMember.role },
    })

    revalidatePath(`/${orgSlug}/users`)
    return { success: true, data: null }
  } catch (err) {
    console.error('[removeMember]', { error: err instanceof Error ? err.message : String(err), orgSlug, memberId, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao remover membro.' }
  }
}

export async function inviteMember(
  orgSlug: string,
  input: { email: string; role: MemberRole },
): Promise<ActionResult<{ inviteId: string }>> {
  try {
    const { orgId, userId } = await requireRole(orgSlug, 'ADMIN')

    const parsed = z.object({
      email: z.string().trim().email('E-mail inválido').max(254, 'E-mail muito longo').toLowerCase(),
      role:  z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
    }).safeParse(input)

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const data = parsed.data

    // Check org member limit
    const [org, memberCount] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, select: { maxUsers: true } }),
      prisma.orgMember.count({ where: { orgId, isActive: true } }),
    ])
    if (org && memberCount >= org.maxUsers) {
      return {
        success: false,
        error: `Limite de ${org.maxUsers} usuário(s) atingido. Faça upgrade do plano.`,
      }
    }

    // Check for existing active member with that email
    const existingProfile = await prisma.profile.findUnique({
      where: { email: data.email },
      select: { id: true },
    })
    if (existingProfile) {
      const alreadyMember = await prisma.orgMember.findUnique({
        where: { orgId_userId: { orgId, userId: existingProfile.id } },
        select: { isActive: true },
      })
      if (alreadyMember?.isActive) {
        return { success: false, error: 'Este usuário já é membro da organização.' }
      }
    }

    // Check for pending invite
    const pendingInvite = await prisma.orgInvite.findFirst({
      where: { orgId, email: data.email, status: 'PENDING' },
      select: { id: true },
    })
    if (pendingInvite) {
      return { success: false, error: 'Já existe um convite pendente para este e-mail.' }
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const invite = await prisma.orgInvite.create({
      data: {
        orgId,
        email: data.email,
        role: data.role,
        invitedById: userId,
        expiresAt,
      },
    })

    await createAuditLog({
      orgId,
      userId,
      action: 'CREATED',
      entityType: 'OrgInvite',
      entityId: invite.id,
      after: { email: data.email, role: data.role },
    })

    revalidatePath(`/${orgSlug}/users`)
    return { success: true, data: { inviteId: invite.id } }
  } catch (err) {
    console.error('[inviteMember]', { error: err instanceof Error ? err.message : String(err), orgSlug, timestamp: new Date().toISOString() })
    return { success: false, error: 'Erro ao enviar convite.' }
  }
}
