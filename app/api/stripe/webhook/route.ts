import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe, syncOrgPlanFromStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription && session.metadata?.orgId) {
          await prisma.organization.update({
            where: { id: session.metadata.orgId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          })
          await syncOrgPlanFromStripe(session.subscription as string)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoice.parent?.subscription_details?.subscription
        if (subId) {
          await syncOrgPlanFromStripe(subId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const failedSubId = invoice.parent?.subscription_details?.subscription
        if (failedSubId) {
          await prisma.organization.updateMany({
            where: { stripeSubscriptionId: failedSubId },
            data: { subscriptionStatus: 'PAST_DUE' },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await syncOrgPlanFromStripe(subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await prisma.organization.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: 'FREE',
            subscriptionStatus: 'CANCELED',
            stripeSubscriptionId: null,
            maxUsers: 1,
            maxProducts: 100,
          },
        })
        break
      }
    }
  } catch (error) {
    console.error(`Stripe webhook handler error [${event.type}]:`, error)
    // Return 200 to Stripe even on business logic errors
    // to prevent retry loops
  }

  return NextResponse.json({ received: true })
}
