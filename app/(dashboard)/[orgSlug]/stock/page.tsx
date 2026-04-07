import { getOrgBySlug } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { OpenMovementButton } from './components/OpenMovementButton'

export default async function StockPage({ params, searchParams }: {
  params: { orgSlug: string }
  searchParams: { type?: string }
}) {
  const { org } = await getOrgBySlug(params.orgSlug)
  const typeFilter = searchParams.type

  const where: any = { orgId: org.id }
  if (typeFilter) where.type = typeFilter

  const [movements, todayIn, todayOut, transfers, adjustments] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { product: true, performedBy: true, location: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []),
    prisma.stockMovement.count({
      where: { orgId: org.id, type: 'IN', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }).catch(() => 0),
    prisma.stockMovement.count({
      where: { orgId: org.id, type: 'OUT', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }).catch(() => 0),
    prisma.stockMovement.count({
      where: { orgId: org.id, type: 'TRANSFER', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }).catch(() => 0),
    prisma.stockMovement.count({
      where: { orgId: org.id, type: 'ADJUSTMENT', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }).catch(() => 0),
  ])

  const typeLabels: Record<string, { label: string; badge: string }> = {
    IN: { label: 'Entrada', badge: 'ok' },
    OUT: { label: 'Saída', badge: 'critical' },
    TRANSFER: { label: 'Transferência', badge: 'info' },
    ADJUSTMENT: { label: 'Ajuste', badge: 'warning' },
    RETURN: { label: 'Devolução', badge: 'ok' },
  }

  return (
    <>
      <div className="dash-header">
        <div className="dash-header-left">
          <div>
            <div className="dash-header-title">Movimentações</div>
            <div className="dash-header-sub">Entradas, saídas e transferências</div>
          </div>
        </div>
        <div className="dash-header-right">
          <OpenMovementButton />
        </div>
      </div>

      <div className="dash-content">
        <div className="dash-metrics">
          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Entradas Hoje</span>
              <div className="dash-metric-icon green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
              </div>
            </div>
            <div className="dash-metric-value" style={{ color: '#2E7D32' }}>+{todayIn}</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Saídas Hoje</span>
              <div className="dash-metric-icon red">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
              </div>
            </div>
            <div className="dash-metric-value" style={{ color: '#E53935' }}>-{todayOut}</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Transferências</span>
              <div className="dash-metric-icon blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              </div>
            </div>
            <div className="dash-metric-value">{transfers}</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Ajustes</span>
              <div className="dash-metric-icon orange">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
            </div>
            <div className="dash-metric-value">{adjustments}</div>
          </div>
        </div>

        <div className="dash-table-wrap">
          <div className="dash-table-header">
            <span className="dash-table-title">Histórico de Movimentações</span>
            <div className="dash-page-filters">
              <a href={`/${params.orgSlug}/stock`} className={`dash-filter-btn ${!typeFilter ? 'active' : ''}`}>Todas</a>
              <a href={`/${params.orgSlug}/stock?type=IN`} className={`dash-filter-btn ${typeFilter === 'IN' ? 'active' : ''}`}>Entradas</a>
              <a href={`/${params.orgSlug}/stock?type=OUT`} className={`dash-filter-btn ${typeFilter === 'OUT' ? 'active' : ''}`}>Saídas</a>
              <a href={`/${params.orgSlug}/stock?type=TRANSFER`} className={`dash-filter-btn ${typeFilter === 'TRANSFER' ? 'active' : ''}`}>Transferências</a>
            </div>
          </div>
          {movements.length > 0 ? (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Antes → Depois</th>
                  <th>Local</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m: any) => {
                  const t = typeLabels[m.type] || { label: m.type, badge: 'neutral' }
                  return (
                    <tr key={m.id}>
                      <td className="mono">{new Date(m.createdAt).toLocaleDateString('pt-BR')} {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td><span className={`dash-badge ${t.badge}`}>{t.label}</span></td>
                      <td className="bold">{m.product.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: m.type === 'IN' || m.type === 'RETURN' ? '#2E7D32' : m.type === 'OUT' ? '#E53935' : '#444' }}>
                        {m.type === 'IN' || m.type === 'RETURN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}
                      </td>
                      <td className="mono">{m.stockBefore} → {m.stockAfter}</td>
                      <td style={{ fontSize: '12px', color: '#888' }}>{m.location.name}</td>
                      <td style={{ fontSize: '12px', color: '#888' }}>{m.performedBy.fullName || m.performedBy.email}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="dash-empty">
              <div className="dash-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/></svg>
              </div>
              <div className="dash-empty-title">Nenhuma movimentação</div>
              <div className="dash-empty-desc">Registre entradas e saídas para acompanhar o estoque.</div>
              <OpenMovementButton />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
