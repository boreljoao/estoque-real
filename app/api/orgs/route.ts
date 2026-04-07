import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/emails/send'

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
})

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 3 orgs/hour per user
    const limited = await checkRateLimit('org-create', `user:${user.id}`)
    if (limited) return limited

    const body = await request.json()
    const parsed = createOrgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, slug } = parsed.data

    // Check slug uniqueness
    const existing = await prisma.organization.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }

    // Create org + owner membership in a transaction
    const org = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: { name, slug },
      })

      await tx.orgMember.create({
        data: {
          orgId: newOrg.id,
          userId: user.id,
          role: 'OWNER',
        },
      })

      // Create default stock location
      await tx.stockLocation.create({
        data: {
          orgId: newOrg.id,
          name: 'Depósito Principal',
          isDefault: true,
        },
      })

      return newOrg
    })

    // Send welcome email (fire-and-forget — don't block the response)
    const profile = await prisma.profile.findUnique({
      where:  { id: user.id },
      select: { fullName: true, email: true },
    }).catch(() => null)

    sendEmail({
      template: 'welcome',
      to:       user.email!,
      data: {
        userName: profile?.fullName ?? user.email ?? 'Usuário',
        orgName:  org.name,
        appUrl:   `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}`,
      },
    }).catch((err) => console.error('[orgs] welcome email failed:', err))

    return NextResponse.json({ org }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orgs]', { error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.orgMember.findMany({
      where: { userId: user.id, isActive: true },
      include: { org: true },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({
      orgs: memberships.map((m) => ({
        ...m.org,
        role: m.role,
      })),
    })
  } catch (error) {
    console.error('[GET /api/orgs]', { error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
