import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

function fmtDateTime(d) {
  try {
    const dateObj = d instanceof Date ? d : new Date(d)
    return new Intl.DateTimeFormat('en-ZW', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch {
    return String(d)
  }
}

export async function buildTicketsPdf({ order, baseUrl }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 })

  const chunks = []
  doc.on('data', (c) => chunks.push(c))

  const eventTitle = order?.event?.title || 'Event'
  const eventStartsAt = order?.event?.startsAt
  const venue = [order?.event?.venue, order?.event?.city].filter(Boolean).join(' • ') || 'TBA'

  const name = order?.customer?.name || 'Attendee'
  const email = order?.customer?.email || ''
  const orderNumber = order?.orderNumber || ''

  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
  const hasLogo = fs.existsSync(logoPath)

  // Header
  const headerTop = doc.y
  if (hasLogo) {
    try {
      doc.image(logoPath, 40, headerTop, { width: 28, height: 28 })
    } catch {
      // ignore
    }
  }
  doc
    .fillColor('#111111')
    .fontSize(18)
    .text('Shoppy Tickets', 40 + (hasLogo ? 36 : 0), headerTop + 2)

  doc.moveDown(1)

  // Event title
  doc.fillColor('#111111').fontSize(16).text(eventTitle)
  doc.moveDown(0.25)

  // Event meta row
  doc
    .fillColor('#444444')
    .fontSize(10)
    .text(`Date: ${eventStartsAt ? fmtDateTime(eventStartsAt) : 'TBA'}`)
  doc.text(`Venue: ${venue}`)

  doc.moveDown(0.6)

  // Attendee box
  doc
    .roundedRect(40, doc.y, 515, 54, 12)
    .lineWidth(1)
    .strokeColor('#E5E7EB')
    .stroke()

  const boxTop = doc.y + 12
  doc.fillColor('#111111').fontSize(11).text('Attendee', 56, boxTop)
  doc.fillColor('#111111').fontSize(12).text(name, 56, boxTop + 16)
  doc.fillColor('#6B7280').fontSize(10).text(email, 56, boxTop + 34)

  doc.fillColor('#6B7280').fontSize(10).text('Order', 360, boxTop)
  doc.fillColor('#111111').fontSize(12).text(orderNumber, 360, boxTop + 16)

  doc.y = boxTop + 58
  doc.moveDown(0.8)

  // Each ticket page/card
  for (let i = 0; i < (order.items || []).length; i++) {
    const it = order.items[i]
    const ticketType = it.ticketType?.name || 'Ticket'

    // Build QR
    const pngDataUrl = await QRCode.toDataURL(it.qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 720,
    })
    const pngBase64 = pngDataUrl.split(',')[1]
    const pngBuffer = Buffer.from(pngBase64, 'base64')

    // Ticket card
    const cardTop = doc.y
    const cardH = 220

    doc
      .roundedRect(40, cardTop, 515, cardH, 16)
      .lineWidth(1)
      .strokeColor('#E5E7EB')
      .stroke()

    // ADMIT strip
    doc
      .roundedRect(40, cardTop, 515, 36, 16)
      .fillColor('#ECFDF5')
      .fill()
    doc.fillColor('#047857').fontSize(11).text('ADMIT ONE', 60, cardTop + 11)

    // Ticket info
    doc.fillColor('#111111').fontSize(13).text(ticketType, 60, cardTop + 55)
    doc.fillColor('#444444').fontSize(10).text(`Ticket code: ${it.ticketCode}`, 60, cardTop + 75)

    // Show attendee on the ticket itself
    doc.fillColor('#6B7280').fontSize(10).text('Name', 60, cardTop + 100)
    doc.fillColor('#111111').fontSize(11).text(name, 60, cardTop + 114)

    doc.fillColor('#6B7280').fontSize(10).text('Email', 60, cardTop + 138)
    doc.fillColor('#111111').fontSize(11).text(email, 60, cardTop + 152, { width: 250 })

    // QR
    doc.image(pngBuffer, 392, cardTop + 58, { width: 145, height: 145 })

    // Footer text
    doc
      .fillColor('#6B7280')
      .fontSize(9)
      .text('Refundable up to 72 hours before the event (minus fees).', 60, cardTop + 184, {
        width: 310,
      })

    if (baseUrl) {
      doc.fillColor('#6B7280').fontSize(9).text(`Support: ${baseUrl}`, 60, cardTop + 198, { width: 310 })
    }

    doc.y = cardTop + cardH + 18

    // Page break if needed
    if (i < (order.items || []).length - 1 && doc.y > 600) {
      doc.addPage()
    }
  }

  doc.end()

  const buffer = await new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  return buffer
}
