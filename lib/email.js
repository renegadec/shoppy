import { Resend } from 'resend'
import QRCode from 'qrcode'
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

  const items = order.items || []

  const qrBlocks = await Promise.all(
    items.map(async (it) => {
      const pngDataUrl = await QRCode.toDataURL(it.qrPayload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 420,
      })

      return {
        ticketCode: it.ticketCode,
        ticketType: it.ticketType?.name || 'Ticket',
        pngDataUrl,
      }
    })
  )

  let pdfBase64 = null
  try {
    const pdfBuffer = await buildTicketsPdf({ order, baseUrl })
    pdfBase64 = pdfBuffer.toString('base64')
  } catch (e) {
    console.error('PDF build failed, sending email without attachment:', e)
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

    <p style="margin:0 0 12px; color:#444;">We attached a PDF ticket file for easy entry validation.</p>

    ${qrBlocks
      .map(
        (b) => `
      <div style="border:1px solid #e5e7eb; border-radius:16px; padding:14px; margin:12px 0;">
        <div style="display:flex; gap:14px; align-items:flex-start;">
          <img src="${b.pngDataUrl}" alt="QR Ticket" width="160" height="160" style="border-radius:12px; border:1px solid #e5e7eb;" />
          <div>
            <p style="margin:0; font-weight:700;">${escapeHtml(b.ticketType)}</p>
            <p style="margin:6px 0 0; color:#444;">Ticket Code: <strong>${escapeHtml(b.ticketCode)}</strong></p>
            <p style="margin:10px 0 0; color:#444; font-size:12px;">Show this QR code at entry.</p>
          </div>
        </div>
      </div>
    `
      )
      .join('')}

    <p style="margin:16px 0 0; color:#444; font-size:12px;">Need help? Reply to this email or contact Shoppy support.</p>
    <p style="margin:10px 0 0; color:#444; font-size:12px;">${baseUrl ? `Website: <a href=\"${baseUrl}\">${baseUrl}</a>` : ''}</p>
  </div>
  `

  return resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(pdfBase64
      ? {
          attachments: [
            {
              filename: `tickets-${order.orderNumber}.pdf`,
              content: pdfBase64,
            },
          ],
        }
      : {}),
  })
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
