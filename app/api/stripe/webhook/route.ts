import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe, syncOrgPlanFromStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/emails/send'
import type Stripe from 'stripe'

// ─── Redis idempotency (only when Upstash is configured) ──────────────────────

async function markProcessed(eventId: string): Promise<boolean> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return false   // no Redis → skip dedup (dev mode)

  // SET NX EX 86400 — only set if key doesn't exist, TTL 24 h
  const res = await fetch(`${url}/set/stripe:event:${eventId}/1/nx/ex/86400`, {
    method:  'GET',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!res?.ok) return false

  const body = await res.json().catch(() => null)
  // Upstash returns { result: "OK" } on first write, { result: null } when key already exists
  return body?.result !== 'OK'   // true → already processed, skip
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body      = await request.text()
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

  // ── Replay-attack protection: reject events older than 5 minutes ───────────
  const AGE_LIMIT_SECONDS = 5 * 60
  const ageSeconds = Math.floor(Date.now() / 1000) - event.created
  if (ageSeconds > AGE_LIMIT_SECONDS) {
    console.warn('[stripe-webhook] Stale event rejected', {
      eventId:    event.id,
      type:       event.type,
      ageSeconds,
    })
    // Return 200 so Stripe doesn't keep retrying a legitimately old event
    return NextResponse.json({ received: true, skipped: 'stale' })
  }

  // ── Idempotency: skip if we've already processed this event ───────────────
  const alreadyProcessed = await markProcessed(event.id)
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, skipped: 'duplicate' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription && session.metadata?.orgId) {
          await prisma.organization.update({
            where: { id: session.metadata.orgId },
            data: {
              stripeCustomerId:     session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          })
          await syncOrgPlanFromStripe(session.subscription as string)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.parent?.subscription_details?.subscription
        if (subId) {
          await syncOrgPlanFromStripe(subId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice     = event.data.object as Stripe.Invoice
        const failedSubId = invoice.parent?.subscription_details?.subscription
        if (failedSubId) {
          await prisma.organization.updateMany({
            where: { stripeSubscriptionId: failedSubId },
            data:  { subscriptionStatus: 'PAST_DUE' },
          })

          // Send payment-failed email to OWNER of the org
          const org = await prisma.organization.findFirst({
            where:   { stripeSubscriptionId: failedSubId },
            include: {
              members: {
                where:   { role: 'OWNER', isActive: true },
                include: { user: { select: { email: true } } },
              },
            },
          }).catch(() => null)

          if (org?.members[0]?.user?.email) {
            const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.stockpro.com.br'
            const portalUrl = `${appUrl}/${org.slug}/settings`
            const amountNum = typeof invoice.amount_due === 'number'
              ? (invoice.amount_due / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
              : null

            sendEmail({
              template: 'payment-failed',
              to:       org.members[0].user.email,
              data: {
                orgName:   org.name,
                orgSlug:   org.slug,
                appUrl,
                portalUrl,
                amount:    amountNum ? `R$ ${amountNum}` : undefined,
                dueDate:   invoice.due_date
                  ? new Date(invoice.due_date * 1000).toISOString()
                  : undefined,
              },
            }).catch((err) => console.error('[webhook] payment-failed email error:', err))
          }
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
            plan:                 'FREE',
            subscriptionStatus:   'CANCELED',
            stripeSubscriptionId: null,
            maxUsers:             1,
            maxProducts:          100,
          },
        })
        break
      }
    }
  } catch (error) {
    console.error(`Stripe webhook handler error [${event.type}]:`, {
      error:   error instanceof Error ? error.message : String(error),
      eventId: event.id,
      type:    event.type,
    })
    // Return 200 to Stripe even on business logic errors to prevent retry loops
  }

  return NextResponse.json({ received: true })
}
