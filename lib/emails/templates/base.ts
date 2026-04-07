// ─── Shared HTML wrapper for all transactional emails ─────────────────────────
// Uses table-based layout for broad email client compatibility.

export function emailBase({
  previewText,
  content,
}: {
  previewText: string
  content:     string
}): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>StockPro</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
         style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
             style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#0F172A;padding:22px 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="background:#2563EB;border-radius:8px;width:34px;height:34px;text-align:center;vertical-align:middle;">
                  <span style="font-size:16px;font-weight:bold;color:#ffffff;line-height:34px;display:block;">S</span>
                </td>
                <td style="padding-left:10px;">
                  <span style="font-size:18px;font-weight:bold;color:#F8FAFC;font-family:Arial,sans-serif;letter-spacing:-0.3px;">StockPro</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        ${content}

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.6;">
              Você recebeu este email porque tem uma conta no StockPro.<br />
              Se não reconhece esta atividade, ignore este email.
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              © ${year} StockPro · CNPJ 00.000.000/0001-00 · Feito no Brasil 🇧🇷
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
</body>
</html>`
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

export function btnPrimary(href: string, label: string, color = '#2563EB'): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="border-radius:10px;background:${color};">
          <a href="${href}"
             target="_blank"
             style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;font-family:Arial,sans-serif;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

export function divider(): string {
  return `<tr><td style="padding:0 32px;"><div style="height:1px;background:#f1f5f9;"></div></td></tr>`
}
