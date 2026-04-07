import { getOrgBySlug } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BillingSection } from './components/BillingSection'

export default async function SettingsPage({ params }: { params: { orgSlug: string } }) {
  const { org, role } = await getOrgBySlug(params.orgSlug)

  const [memberCount, productCount, locations] = await Promise.all([
    prisma.orgMember.count({ where: { orgId: org.id, isActive: true } }).catch(() => 0),
    prisma.product.count({ where: { orgId: org.id, isArchived: false } }).catch(() => 0),
    prisma.stockLocation.findMany({ where: { orgId: org.id } }).catch(() => []),
  ])

  const isOwner = role === 'OWNER'
  const isAdmin = role === 'ADMIN' || isOwner

  return (
    <>
      <div className="dash-header">
        <div className="dash-header-left">
          <div>
            <div className="dash-header-title">Configurações</div>
            <div className="dash-header-sub">Gerencie sua organização</div>
          </div>
        </div>
      </div>

      <div className="dash-content">
        {/* ── Organização ── */}
        <div className="dash-settings-section">
          <div className="dash-settings-title">Organização</div>
          <div className="dash-settings-desc">Informações da sua empresa</div>

          <div className="dash-settings-row">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Nome</div>
              <div style={{ fontSize: 12, color: '#888' }}>{org.name}</div>
            </div>
            {isOwner && <button className="dash-btn dash-btn-secondary">Editar</button>}
          </div>

          <div className="dash-settings-row">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Slug (URL)</div>
              <div style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-mono)' }}>/{org.slug}</div>
            </div>
          </div>
        </div>

        {/* ── Billing ── */}
        {isAdmin && (
          <BillingSection
            orgId={org.id}
            orgSlug={org.slug}
            plan={org.plan}
            subscriptionStatus={org.subscriptionStatus}
            trialEndsAt={org.trialEndsAt?.toISOString() ?? null}
            currentPeriodEnd={org.currentPeriodEnd?.toISOString() ?? null}
            maxProducts={org.maxProducts}
            maxUsers={org.maxUsers}
            productCount={productCount}
            memberCount={memberCount}
            isOwner={isOwner}
          />
        )}

        {/* ── Stock locations ── */}
        <div className="dash-settings-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div className="dash-settings-title">Localizações de Estoque</div>
              <div className="dash-settings-desc" style={{ marginBottom: 0 }}>Depósitos, lojas e centros de distribuição</div>
            </div>
            <button className="dash-btn dash-btn-secondary">+ Novo Local</button>
          </div>
          {locations.length > 0 ? (
            locations.map((loc: any) => (
              <div key={loc.id} className="dash-settings-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{loc.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {loc.isDefault && <span className="dash-badge ok" style={{ marginRight: 4 }}>Padrão</span>}
                      {loc.isActive ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </div>
                <button className="dash-btn dash-btn-ghost">Editar</button>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>
              Nenhuma localização cadastrada. Adicione seu primeiro depósito.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
