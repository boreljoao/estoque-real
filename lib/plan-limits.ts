import { prisma } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LimitResource = 'products' | 'users'

export type LimitCheckResult = {
  allowed:  boolean
  current:  number
  max:      number
  plan:     string
}

// Returned by Server Actions when a limit is hit
export type LimitReachedPayload = {
  success: false
  error:   'LIMIT_REACHED'
  current: number
  max:     number
  plan:    string
}

// ─── Read-only check (display / pre-validation) ───────────────────────────────
// Not transactional — use only for UI display.
// For enforcement at create-time use withLimitLock() inside a $transaction.

export async function checkLimit(
  orgId:    string,
  resource: LimitResource,
): Promise<LimitCheckResult> {
  const org = await prisma.organization.findUniqueOrThrow({
    where:  { id: orgId },
    select: { maxProducts: true, maxUsers: true, plan: true },
  })

  const max = resource === 'products' ? org.maxProducts : org.maxUsers

  const current =
    resource === 'products'
      ? await prisma.product.count({ where: { orgId, isArchived: false } })
      : await prisma.orgMember.count({ where: { orgId, isActive: true } })

  return {
    allowed: current < max,
    current,
    max,
    plan: org.plan,
  }
}

// ─── Transactional limit check with row-level lock ────────────────────────────
// Call this inside prisma.$transaction(async (tx) => { ... }).
// Locks the org row to prevent concurrent over-limit inserts.
// Throws a LimitError if the limit is reached — caller must catch and convert
// to ActionResult.

export class LimitError extends Error {
  constructor(
    public readonly current: number,
    public readonly max:     number,
    public readonly plan:    string,
  ) {
    super('LIMIT_REACHED')
    this.name = 'LimitError'
  }
}

type OrgLimitRow = {
  max_products: number
  max_users:    number
  plan:         string
}

export async function withLimitLock(
  tx:       Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  orgId:    string,
  resource: LimitResource,
): Promise<void> {
  // Lock the org row for the duration of the transaction
  const rows = await tx.$queryRaw<OrgLimitRow[]>`
    SELECT max_products, max_users, plan::text AS plan
    FROM organizations
    WHERE id = ${orgId}::uuid
    FOR UPDATE
  `

  if (rows.length === 0) throw new Error('Organization not found')
  const org = rows[0]

  const max = resource === 'products' ? org.max_products : org.max_users

  const current =
    resource === 'products'
      ? await tx.product.count({ where: { orgId, isArchived: false } })
      : await tx.orgMember.count({ where: { orgId, isActive: true } })

  if (current >= max) {
    throw new LimitError(current, max, org.plan)
  }
}

// ─── Helper: convert LimitError → LimitReachedPayload ────────────────────────

export function limitReachedPayload(e: LimitError): LimitReachedPayload {
  return {
    success: false,
    error:   'LIMIT_REACHED',
    current: e.current,
    max:     e.max,
    plan:    e.plan,
  }
}
