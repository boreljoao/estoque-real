import { emailBase, btnPrimary } from './base'

export type InviteEmailData = {
  inviterName: string
  orgName:     string
  role:        string
  inviteUrl:   string
  expiresAt:   string   // ISO date string
}

const ROLE_LABELS: Record<string, { label: string; desc: string }> = {
  OWNER:  { label: 'Proprietário', desc: 'Acesso total, incluindo faturamento e configurações.' },
  ADMIN:  { label: 'Administrador', desc: 'Gerencia usuários, produtos e todas as movimentações.' },
  EDITOR: { label: 'Editor',       desc: 'Pode criar e editar produtos e registrar movimentações.' },
  VIEWER: { label: 'Visualizador', desc: 'Apenas visualiza dashboard, produtos e relatórios.' },
}

export function renderInviteEmail(data: InviteEmailData): { subject: string; html: string } {
  const { inviterName, orgName, role, inviteUrl, expiresAt } = data
  const roleInfo   = ROLE_LABELS[role] ?? { label: role, desc: '' }
  const expireDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const content = `
    <tr>
      <td style="padding:40px 32px 24px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;">
          Convite recebido
        </p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">
          Você foi convidado para<br />${orgName}
        </h1>
        <p style="margin:0 0 28px;font-size:15px;color:#64748B;line-height:1.65;">
          <strong style="color:#0F172A;">${inviterName}</strong> convidou você para participar
          da organização <strong style="color:#0F172A;">${orgName}</strong> no StockPro.
        </p>
        ${btnPrimary(inviteUrl, 'Aceitar convite')}
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 28px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="vertical-align:top;padding-right:16px;">
                <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Sua função</p>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">${roleInfo.label}</p>
                <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;">${roleInfo.desc}</p>
              </td>
              <td style="vertical-align:top;border-left:1px solid #e2e8f0;padding-left:16px;">
                <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Expira em</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${expireDate}</p>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 40px;">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
          Se você não esperava este convite, pode ignorar este email com segurança.
          O link expira em 7 dias e só pode ser usado uma vez.
        </p>
      </td>
    </tr>`

  return {
    subject: `${inviterName} convidou você para ${orgName} no StockPro`,
    html:    emailBase({ previewText: `Aceite o convite e comece a gerenciar o estoque de ${orgName}.`, content }),
  }
}
