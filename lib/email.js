import { Resend } from 'resend'
import { buildTicketsPdf } from './pdf'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendTicketEmail({ order, baseUrl }) {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set; skipping ticket email')
    return { skipped: true }
  }

  const from = process.env.EMAIL_FROM || 'tickets@shoppy.co.zw'
  const to = order?.customer?.email
  if (!to) throw new Error('Missing customer email')

  // We only send the PDF attachment (no separate QR images).

  let pdfBuffer = null
  let pdfError = null
  try {
    pdfBuffer = await buildTicketsPdf({ order, baseUrl })
  } catch (e) {
    pdfError = e
    console.error('PDF build failed:', e)
  }

  if (!pdfBuffer) {
    throw new Error(`Ticket PDF generation failed${pdfError?.message ? `: ${pdfError.message}` : ''}`)
  }

  const subject = `Your tickets: ${order.event?.title || 'Event'} (${order.orderNumber})`

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#111;">
    <h2 style="margin:0 0 8px;">Your ticket(s) are ready</h2>
    <p style="margin:0 0 12px; color:#444;">
      Event: <strong>${escapeHtml(order.event?.title || '')}</strong><br/>
      Name: <strong>${escapeHtml(order.customer?.name || '')}</strong><br/>
      Order: <strong>${escapeHtml(order.orderNumber)}</strong>
    </p>

    <div style="padding:12px 14px; border:1px solid #e5e7eb; border-radius:14px; background:#f9fafb; margin: 16px 0;">
      <p style="margin:0; color:#111;"><strong>Refund policy</strong>: refundable up to 72 hours before the event (minus fees).</p>
    </div>

    <p style="margin:0 0 12px; color:#444;">Your ticket PDF is attached. Present it at entry.</p>

    <p style="margin:16px 0 0; color:#444; font-size:12px;">Need help? Reply to this email or contact Shoppy support.</p>
    <p style="margin:10px 0 0; color:#444; font-size:12px;">${baseUrl ? `Website: <a href=\"${baseUrl}\">${baseUrl}</a>` : ''}</p>
  </div>
  `

  const attachments = [
    {
      filename: `tickets-${order.orderNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ]

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments,
  })

  return {
    result,
    pdfAttached: true,
    pdfError: null,
    attachments: attachments.map((a) => a.filename),
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
