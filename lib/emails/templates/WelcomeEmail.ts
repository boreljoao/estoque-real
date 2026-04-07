import { emailBase, btnPrimary } from './base'

export type WelcomeEmailData = {
  userName: string
  orgName:  string
  appUrl:   string
}

const TIPS = [
  {
    icon:  '📦',
    title: 'Cadastre seus produtos',
    desc:  'Vá em Produtos → Novo produto. Importe em lote via planilha CSV ou cadastre um a um.',
  },
  {
    icon:  '⚡',
    title: 'Registre movimentações',
    desc:  'Use Ctrl+K para o painel rápido de movimentação. Entrada, saída e transferência em segundos.',
  },
  {
    icon:  '🔔',
    title: 'Configure alertas de estoque',
    desc:  'Defina o estoque mínimo por produto. Você receberá um alerta antes que o item acabe.',
  },
]

export function renderWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const { userName, orgName, appUrl } = data

  const tipsHtml = TIPS.map((tip) => `
    <tr>
      <td style="padding:12px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="width:40px;vertical-align:top;font-size:22px;line-height:1;">${tip.icon}</td>
            <td style="vertical-align:top;padding-left:12px;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:#0F172A;">${tip.title}</p>
              <p style="margin:0;font-size:13px;color:#64748B;line-height:1.5;">${tip.desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  const content = `
    <tr>
      <td style="padding:40px 32px 32px;">
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">
          Bem-vindo, ${userName}! 🎉
        </h1>
        <p style="margin:0 0 28px;font-size:15px;color:#64748B;line-height:1.65;">
          Sua conta no StockPro está pronta. A organização <strong style="color:#0F172A;">${orgName}</strong>
          foi criada com sucesso — agora você tem controle total do seu estoque.
        </p>
        ${btnPrimary(appUrl, 'Acessar StockPro →')}
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 32px;">
        <div style="background:#f8fafc;border-radius:12px;padding:24px;">
          <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.5px;">
            3 primeiros passos
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${tipsHtml}
          </table>
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding:0 32px 40px;">
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
          Precisa de ajuda?
          <a href="https://docs.stockpro.com.br" style="color:#2563EB;text-decoration:none;">Acesse a documentação</a>
          ou responda este email — nossa equipe está aqui.
        </p>
      </td>
    </tr>`

  return {
    subject: `Bem-vindo ao StockPro, ${userName}! Sua conta está pronta ✅`,
    html:    emailBase({ previewText: `Sua organização ${orgName} foi criada. Veja como começar.`, content }),
  }
}
