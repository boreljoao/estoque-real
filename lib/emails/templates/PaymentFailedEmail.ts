import { emailBase, btnPrimary } from './base'

export type PaymentFailedEmailData = {
  orgName:   string
  orgSlug:   string
  appUrl:    string
  portalUrl: string   // pre-generated Stripe Customer Portal URL (or settings page)
  amount?:   string   // e.g. "R$ 149,00"
  dueDate?:  string   // ISO date string
}

export function renderPaymentFailedEmail(data: PaymentFailedEmailData): { subject: string; html: string } {
  const { orgName, portalUrl, amount, dueDate } = data

  const dueDateStr = dueDate
    ? new Date(dueDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const content = `
    <tr>
      <td style="padding:40px 32px 0;">
        <div style="display:inline-block;background:#FEE2E2;border:1px solid #FECACA;border-radius:8px;padding:6px 12px;margin-bottom:20px;">
          <span style="font-size:13px;font-weight:700;color:#991B1B;">❌ Pagamento não processado</span>
        </div>
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">
          Sua assinatura está em risco
        </h1>
        <p style="margin:0 0 28px;font-size:15px;color:#64748B;line-height:1.65;">
          Não conseguimos processar o pagamento da assinatura StockPro Pro
          da organização <strong style="color:#0F172A;">${orgName}</strong>.${
            amount ? ` O valor de <strong>${amount}</strong> não pôde ser cobrado.` : ''
          }
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 24px;">
        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size:22px;vertical-align:top;width:32px;">🔴</td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0F172A;">O que acontece agora?</p>
                <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#64748B;line-height:1.8;">
                  <li>Sua conta continua ativa por mais alguns dias.</li>
                  <li>Faremos novas tentativas de cobrança automaticamente.</li>
                  ${dueDateStr ? `<li>Se não regularizado até <strong>${dueDateStr}</strong>, o plano Pro será suspenso.</li>` : ''}
                  <li>Seus dados são preservados mesmo com conta suspensa.</li>
                </ul>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 12px;">
        ${btnPrimary(portalUrl, 'Atualizar método de pagamento', '#DC2626')}
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 40px;">
        <p style="margin:16px 0 0;font-size:13px;color:#64748B;line-height:1.65;">
          Se já atualizou seu cartão ou acredita que há um erro, responda este email
          ou acesse <a href="${portalUrl}" style="color:#2563EB;text-decoration:none;">o portal de faturamento</a>.
          Sua equipe não perde acesso durante o período de retry.
        </p>
      </td>
    </tr>`

  return {
    subject: `[Ação necessária] Pagamento falhou — StockPro ${orgName}`,
    html:    emailBase({
      previewText: `Não conseguimos cobrar a assinatura de ${orgName}. Atualize seu método de pagamento.`,
      content,
    }),
  }
}
