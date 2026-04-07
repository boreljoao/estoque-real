import { emailBase, btnPrimary } from './base'

export type LowStockItem = {
  name:     string
  sku:      string
  qty:      number
  minStock: number
  url:      string   // direct link to the product page
}

export type LowStockAlertEmailData = {
  orgName:     string
  productsUrl: string  // link to the products page filtered by critical stock
  items:       LowStockItem[]
}

function stockBar(qty: number, min: number): string {
  const pct    = min > 0 ? Math.min(100, Math.round((qty / min) * 100)) : 0
  const color  = qty === 0 ? '#EF4444' : qty <= min / 2 ? '#F97316' : '#F59E0B'
  return `
    <div style="background:#f1f5f9;border-radius:4px;height:6px;width:80px;display:inline-block;vertical-align:middle;overflow:hidden;">
      <div style="background:${color};height:6px;width:${pct}%;border-radius:4px;"></div>
    </div>`
}

export function renderLowStockAlertEmail(data: LowStockAlertEmailData): { subject: string; html: string } {
  const { orgName, productsUrl, items } = data
  const criticalCount = items.filter((i) => i.qty === 0).length

  const rows = items.slice(0, 10).map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
        <a href="${item.url}" style="text-decoration:none;">
          <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0F172A;">${item.name}</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;font-family:monospace;">${item.sku}</p>
        </a>
      </td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f1f5f9;text-align:center;vertical-align:middle;white-space:nowrap;">
        <span style="font-size:16px;font-weight:800;color:${item.qty === 0 ? '#EF4444' : '#F59E0B'};">${item.qty}</span>
        <span style="font-size:11px;color:#94a3b8;"> / mín ${item.minStock}</span>
      </td>
      <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:middle;">
        ${stockBar(item.qty, item.minStock)}
      </td>
    </tr>`).join('')

  const content = `
    <tr>
      <td style="padding:40px 32px 0;">
        <div style="display:inline-block;background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:6px 12px;margin-bottom:20px;">
          <span style="font-size:13px;font-weight:700;color:#92400E;">⚠️ Alerta de estoque crítico</span>
        </div>
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">
          ${items.length} produto${items.length !== 1 ? 's' : ''} com estoque baixo
        </h1>
        <p style="margin:0 0 28px;font-size:14px;color:#64748B;line-height:1.65;">
          ${criticalCount > 0
            ? `<strong style="color:#EF4444;">${criticalCount} produto${criticalCount !== 1 ? 's' : ''} zerado${criticalCount !== 1 ? 's'  : ''}.</strong> `
            : ''}
          A organização <strong style="color:#0F172A;">${orgName}</strong> tem produtos
          abaixo do estoque mínimo configurado.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 24px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <th style="text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;">Produto</th>
                  <th style="text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;padding-left:16px;">Qtd atual</th>
                  <th style="text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;padding-left:12px;">Nível</th>
                </tr>
                ${rows}
              </table>
              ${items.length > 10 ? `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;text-align:center;">+${items.length - 10} outros produtos. Veja todos no dashboard.</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 40px;">
        ${btnPrimary(productsUrl, 'Ver produtos críticos', '#DC2626')}
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
          Você recebe este alerta porque é administrador de <strong>${orgName}</strong>.
          Para ajustar os alertas, vá em Configurações → Notificações.
        </p>
      </td>
    </tr>`

  return {
    subject: `⚠️ [${orgName}] ${items.length} produto${items.length !== 1 ? 's' : ''} com estoque crítico`,
    html:    emailBase({ previewText: `${items.length} produtos estão abaixo do estoque mínimo em ${orgName}.`, content }),
  }
}
