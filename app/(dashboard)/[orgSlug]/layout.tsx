import { getOrgBySlug, getProfile } from '@/lib/auth'
import Link from 'next/link'
import '../dashboard.css'
import { QuickMovementPanel } from './stock/components/QuickMovementPanel'
import { TrialBanner } from './components/TrialBanner'

const navItems = [
  { label: 'Dashboard', href: '', icon: 'dashboard' },
  { label: 'Produtos', href: '/products', icon: 'products' },
  { label: 'Movimentações', href: '/stock', icon: 'stock' },
  { label: 'Fluxo de Caixa', href: '/cash-flow', icon: 'cashflow' },
  { label: 'Usuários', href: '/users', icon: 'users' },
  { label: 'Audit Log', href: '/audit', icon: 'audit' },
  { label: 'Configurações', href: '/settings', icon: 'settings' },
]

const icons: Record<string, JSX.Element> = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  products: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  stock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  cashflow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  audit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgSlug: string }
}) {
  const { org, role } = await getOrgBySlug(params.orgSlug)
  const profile = await getProfile()

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <Link href="/" className="dash-sidebar-logo">
          <div className="dash-sidebar-logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" fill="white" opacity="0.9"/><rect x="5" y="5" width="6" height="6" rx="1" fill="white"/></svg>
          </div>
          StockPro
        </Link>

        <div className="dash-sidebar-org">
          <div>
            <div className="dash-sidebar-org-name">{org.name}</div>
            <div className="dash-sidebar-org-plan">{org.plan}</div>
          </div>
        </div>

        <div className="dash-sidebar-section">Menu</div>
        <nav className="dash-sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${params.orgSlug}${item.href}`}
              className="dash-sidebar-link"
            >
              {icons[item.icon]}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="dash-sidebar-bottom">
          <div className="dash-sidebar-user">
            <div className="dash-sidebar-avatar">{initials}</div>
            <div className="dash-sidebar-user-info">
              <div className="dash-sidebar-user-name">{profile?.fullName || profile?.email || 'Usuário'}</div>
              <div className="dash-sidebar-user-role">{role}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="dash-main">
        <TrialBanner
          orgId={org.id}
          orgSlug={params.orgSlug}
          subscriptionStatus={org.subscriptionStatus}
          trialEndsAt={org.trialEndsAt?.toISOString() ?? null}
          plan={org.plan}
        />
        {children}
      </div>

      <QuickMovementPanel orgSlug={params.orgSlug} />
    </div>
  )
}
