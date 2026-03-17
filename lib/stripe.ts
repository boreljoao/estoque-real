import Stripe from 'stripe'
import { prisma } from './db'
import type { Plan } from '@prisma/client'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const STRIPE_PLANS = {
  FREE: {
    priceId: null,
    maxUsers: 1,
    maxProducts: 100,
    features: ['1 usuário', '100 produtos', 'Estoque básico'],
  },
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    maxUsers: 10,
    maxProducts: Infinity,
    features: ['10 usuários', 'Produtos ilimitados', 'Fluxo de caixa', 'Relatórios', 'Audit log'],
  },
  ENTERPRISE: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    maxUsers: Infinity,
    maxProducts: Infinity,
    features: ['Usuários ilimitados', 'Tudo do Pro', 'SSO', 'SLA', 'Suporte prioritário'],
  },
} satisfies Record<Plan, { priceId: string | null; maxUsers: number; maxProducts: number; features: string[] }>

export async function getOrCreateStripeCustomer(orgId: string, email: string, orgName: string) {
  try {
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })

    if (org.stripeCustomerId) {
      return await stripe.customers.retrieve(org.stripeCustomerId)
    }

    const customer = await stripe.customers.create({
      email,
      name: orgName,
      metadata: { orgId },
    })

    await prisma.organization.update({
      where: { id: orgId },
      data: { stripeCustomerId: customer.id },
    })

    return customer
  } catch (error) {
    console.error('Failed to get/create Stripe customer:', error)
    throw error
  }
}

export async function syncOrgPlanFromStripe(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    })

    const priceId = subscription.items.data[0].price.id
    let plan: Plan = 'FREE'

    if (priceId === STRIPE_PLANS.PRO.priceId) plan = 'PRO'
    else if (priceId === STRIPE_PLANS.ENTERPRISE.priceId) plan = 'ENTERPRISE'

    await prisma.organization.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        plan,
        subscriptionStatus: subscription.status.toUpperCase() as 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' | 'PAUSED',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        maxUsers:    STRIPE_PLANS[plan].maxUsers === Infinity ? 999999 : STRIPE_PLANS[plan].maxUsers,
        maxProducts: STRIPE_PLANS[plan].maxProducts === Infinity ? 999999 : STRIPE_PLANS[plan].maxProducts,
      },
    })
  } catch (error) {
    console.error('Failed to sync org plan from Stripe:', error)
    throw error
  }
}
