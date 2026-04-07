import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = (await request.json()) as { orgId: string }

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
    }

    // Verify caller is OWNER or ADMIN
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          where: { userId: user.id, isActive: true, role: { in: ['OWNER', 'ADMIN'] } },
          select: { role: true },
        },
      },
    })

    if (!org || org.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!org.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 },
      )
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings`

    const session = await getStripe().billingPortal.sessions.create({
      customer:   org.stripeCustomerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/portal]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
