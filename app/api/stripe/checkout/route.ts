import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStripe, getOrCreateStripeCustomer, STRIPE_PLANS } from '@/lib/stripe'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { Plan } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const limited = await checkRateLimit('checkout', getClientIp())
    if (limited) return limited

    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId, plan } = (await request.json()) as { orgId: string; plan: Plan }

    if (!orgId || !plan || !['PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          where: { userId: user.id, isActive: true, role: { in: ['OWNER', 'ADMIN'] } },
        },
      },
    })

    if (!org || org.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customer = await getOrCreateStripeCustomer(orgId, user.email!, org.name)

    const priceId = STRIPE_PLANS[plan].priceId
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan price' }, { status: 400 })
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings`,
      metadata: { orgId },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
