import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

// ─── Redis singleton ──────────────────────────────────────────────────────────

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

// ─── Limiter definitions ──────────────────────────────────────────────────────
// Lazily created so we don't crash at import time if env vars are missing.

let _limiters: Record<RateLimitKey, Ratelimit> | null = null

function getLimiters(): Record<RateLimitKey, Ratelimit> {
  if (!_limiters) {
    const redis = getRedis()
    _limiters = {
      checkout:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '1 m'), prefix: 'rl:checkout'   }),
      invite:       new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 h'), prefix: 'rl:invite'     }),
      'org-create': new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3,  '1 h'), prefix: 'rl:org-create' }),
      action:       new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'rl:action'     }),
    }
  }
  return _limiters
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RateLimitKey = 'checkout' | 'invite' | 'org-create' | 'action'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the client IP from request headers (works on Vercel and self-hosted). */
export function getClientIp(): string {
  const h = headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Check a sliding-window rate limit.
 *
 * Returns `null` when within limits, or a 429 NextResponse when exceeded.
 * If Upstash is not configured (missing env vars), always returns null (no-op).
 *
 * Usage in API routes:
 *   const limited = await checkRateLimit('checkout', ip)
 *   if (limited) return limited
 */
export async function checkRateLimit(
  key:        RateLimitKey,
  identifier: string,
): Promise<NextResponse | null> {
  // No-op when Upstash is not configured (local dev / missing vars)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  try {
    const limiter = getLimiters()[key]
    const { success, reset } = await limiter.limit(identifier)
    if (success) return null

    const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status:  429,
        headers: { 'Retry-After': String(retryAfter) },
      },
    )
  } catch (err) {
    // Don't let rate-limit errors block legitimate requests
    console.warn('[rate-limit] check failed, allowing request:', err)
    return null
  }
}

/**
 * Variant for Server Actions (no NextResponse — throws a structured error string).
 *
 * Usage in Server Actions:
 *   await assertRateLimit('action', userId)
 */
export async function assertRateLimit(
  key:        RateLimitKey,
  identifier: string,
): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return
  }

  try {
    const limiter = getLimiters()[key]
    const { success, reset } = await limiter.limit(identifier)
    if (!success) {
      const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
      throw new Error(`RATE_LIMITED:${retryAfter}`)
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('RATE_LIMITED:')) throw err
    console.warn('[rate-limit] check failed, allowing request:', err)
  }
}
