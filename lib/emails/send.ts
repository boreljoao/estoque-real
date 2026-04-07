import { Resend } from 'resend'
import { renderWelcomeEmail,     type WelcomeEmailData }      from './templates/WelcomeEmail'
import { renderInviteEmail,      type InviteEmailData }        from './templates/InviteEmail'
import { renderLowStockAlertEmail, type LowStockAlertEmailData } from './templates/LowStockAlertEmail'
import { renderPaymentFailedEmail, type PaymentFailedEmailData } from './templates/PaymentFailedEmail'

// ─── Payload discriminated union ──────────────────────────────────────────────

export type EmailPayload =
  | { template: 'welcome';       to: string;              data: WelcomeEmailData }
  | { template: 'invite';        to: string;              data: InviteEmailData }
  | { template: 'low-stock';     to: string | string[];   data: LowStockAlertEmailData }
  | { template: 'payment-failed'; to: string;             data: PaymentFailedEmailData }

// ─── Renderer map ─────────────────────────────────────────────────────────────

function render(payload: EmailPayload): { subject: string; html: string } {
  switch (payload.template) {
    case 'welcome':        return renderWelcomeEmail(payload.data)
    case 'invite':         return renderInviteEmail(payload.data)
    case 'low-stock':      return renderLowStockAlertEmail(payload.data)
    case 'payment-failed': return renderPaymentFailedEmail(payload.data)
  }
}

// ─── Main send function ───────────────────────────────────────────────────────

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

/**
 * Send a transactional email using a typed template.
 *
 * Returns silently on success. Throws on Resend API error.
 * If RESEND_API_KEY is not set, logs a warning and skips sending (dev mode).
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[sendEmail] RESEND_API_KEY not set — skipping email (template: ${payload.template})`)
    return
  }

  const from = process.env.EMAIL_FROM ?? 'StockPro <noreply@stockpro.com.br>'
  const { subject, html } = render(payload)

  const { error } = await getResend().emails.send({
    from,
    to:      payload.to,
    subject,
    html,
  })

  if (error) {
    console.error(`[sendEmail] Resend error (template: ${payload.template}):`, error)
    throw new Error(`Email delivery failed: ${error.message}`)
  }
}
