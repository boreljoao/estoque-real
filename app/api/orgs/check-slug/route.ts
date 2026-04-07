import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

// Reserved slugs that cannot be used as org identifiers
const RESERVED = new Set([
  'api', 'admin', 'app', 'login', 'register', 'logout', 'onboarding',
  'dashboard', 'settings', 'billing', 'invite', 'pricing', 'help',
  'support', 'docs', 'www', 'mail', 'static', 'assets', 'public',
])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.toLowerCase().trim() ?? ''

  if (!slug) {
    return NextResponse.json({ available: false, reason: 'empty' })
  }

  if (slug.length < 2 || slug.length > 50) {
    return NextResponse.json({ available: false, reason: 'length' })
  }

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ available: false, reason: 'format' })
  }

  if (RESERVED.has(slug)) {
    return NextResponse.json({ available: false, reason: 'reserved' })
  }

  const existing = await prisma.organization.findUnique({
    where:  { slug },
    select: { id: true },
  })

  return NextResponse.json({ available: !existing })
}
