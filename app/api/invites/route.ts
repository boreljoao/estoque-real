import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withLimitLock, LimitError } from '@/lib/plan-limits'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/emails/send'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId, email, role } = await request.json()

    if (!orgId || !email || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Rate limit: 10 invites/hour per org
    const limited = await checkRateLimit('invite', `org:${orgId}`)
    if (limited) return limited

    // Verify caller is ADMIN+ in this org
    const membership = await prisma.orgMember.findFirst({
      where: {
        orgId,
        userId: user.id,
        isActive: true,
        role: { in: ['ADMIN', 'OWNER'] },
      },
      include: { org: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if already a member
    const existingMember = await prisma.orgMember.findFirst({
      where: { orgId, user: { email }, isActive: true },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }

    // Check user limit (transactional, with row lock)
    try {
      await prisma.$transaction(async (tx) => {
        await withLimitLock(tx, orgId, 'users')
      })
    } catch (e) {
      if (e instanceof LimitError) {
        return NextResponse.json(
          {
            error:   'LIMIT_REACHED',
            current: e.current,
            max:     e.max,
            plan:    e.plan,
          },
          { status: 403 },
        )
      }
      throw e
    }

    // Create invite
    const invite = await prisma.orgInvite.create({
      data: {
        orgId,
        email,
        role,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // Send invitation email via template
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`

    await sendEmail({
      template: 'invite',
      to:       email,
      data: {
        inviterName: user.email ?? 'Alguém',
        orgName:     membership.org.name,
        role,
        inviteUrl,
        expiresAt:   invite.expiresAt.toISOString(),
      },
    })

    return NextResponse.json({ invite })
  } catch (error) {
    console.error('[POST /api/invites]', { error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
