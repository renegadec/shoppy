import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
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

function safeStr(v) {
  return String(v ?? '').trim()
}

export async function buildTicketsPdf({ order, baseUrl }) {
  const pdfDoc = await PDFDocument.create()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const eventTitle = safeStr(order?.event?.title) || 'Event'
  const eventStartsAt = order?.event?.startsAt
  const venue = [order?.event?.venue, order?.event?.city].filter(Boolean).join(' • ') || 'TBA'

  const attendeeName = safeStr(order?.customer?.name) || 'Attendee'
  const attendeeEmail = safeStr(order?.customer?.email) || ''
  const orderNumber = safeStr(order?.orderNumber) || ''

  // Optional logo
  let logoImage = null
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    if (fs.existsSync(logoPath)) {
      const bytes = fs.readFileSync(logoPath)
      // PNG
      logoImage = await pdfDoc.embedPng(bytes)
    }
  } catch {
    // ignore logo issues
  }

  const items = order?.items || []

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx]
    const page = pdfDoc.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()

    const margin = 40
    let y = height - margin

    // Header
    if (logoImage) {
      const logoDims = logoImage.scale(28 / logoImage.height)
      page.drawImage(logoImage, {
        x: margin,
        y: y - 24,
        width: logoDims.width,
        height: logoDims.height,
      })
    }

    page.drawText('Shoppy Tickets', {
      x: margin + (logoImage ? 36 : 0),
      y: y - 18,
      size: 18,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
    })

    page.drawText('Ticket template v3', {
      x: margin + (logoImage ? 36 : 0),
      y: y - 32,
      size: 9,
      font: fontRegular,
      color: rgb(0.42, 0.45, 0.5),
    })

    y -= 58

    // Event title
    page.drawText(eventTitle, {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
      maxWidth: width - margin * 2,
    })
    y -= 20

    // Meta
    const metaColor = rgb(0.27, 0.27, 0.27)
    page.drawText(`Date: ${eventStartsAt ? fmtDateTime(eventStartsAt) : 'TBA'}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: metaColor,
    })
    y -= 14
    page.drawText(`Venue: ${venue}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: metaColor,
      maxWidth: width - margin * 2,
    })

    y -= 24

    // ADMIT strip
    const stripH = 30
    page.drawRectangle({
      x: margin,
      y: y - stripH,
      width: width - margin * 2,
      height: stripH,
      color: rgb(0.93, 0.99, 0.96),
      borderColor: rgb(0.89, 0.96, 0.91),
      borderWidth: 1,
    })
    page.drawText('ADMIT ONE', {
      x: margin + 14,
      y: y - 20,
      size: 11,
      font: fontBold,
      color: rgb(0.02, 0.47, 0.34),
    })

    y -= 48

    // Ticket card
    const cardX = margin
    const cardW = width - margin * 2
    const cardH = 210
    const cardY = y - cardH

    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      borderColor: rgb(0.9, 0.91, 0.92),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    })

    const ticketType = safeStr(it?.ticketType?.name) || 'Ticket'
    const ticketCode = safeStr(it?.ticketCode)

    page.drawText(ticketType, {
      x: cardX + 16,
      y: cardY + cardH - 34,
      size: 13,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
    })

    page.drawText(`Ticket code: ${ticketCode}`, {
      x: cardX + 16,
      y: cardY + cardH - 52,
      size: 10,
      font: fontRegular,
      color: rgb(0.27, 0.27, 0.27),
    })

    // Attendee
    page.drawText('Name', {
      x: cardX + 16,
      y: cardY + cardH - 82,
      size: 10,
      font: fontRegular,
      color: rgb(0.42, 0.45, 0.5),
    })
    page.drawText(attendeeName, {
      x: cardX + 16,
      y: cardY + cardH - 98,
      size: 11,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
      maxWidth: 280,
    })

    page.drawText('Email', {
      x: cardX + 16,
      y: cardY + cardH - 126,
      size: 10,
      font: fontRegular,
      color: rgb(0.42, 0.45, 0.5),
    })
    page.drawText(attendeeEmail, {
      x: cardX + 16,
      y: cardY + cardH - 142,
      size: 11,
      font: fontRegular,
      color: rgb(0.07, 0.07, 0.07),
      maxWidth: 320,
    })

    // QR
    const pngDataUrl = await QRCode.toDataURL(it.qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 800,
    })
    const pngBase64 = pngDataUrl.split(',')[1]
    const qrBytes = Buffer.from(pngBase64, 'base64')
    const qrImg = await pdfDoc.embedPng(qrBytes)
    const qrSize = 140
    page.drawImage(qrImg, {
      x: cardX + cardW - qrSize - 18,
      y: cardY + 50,
      width: qrSize,
      height: qrSize,
    })

    // Footer
    page.drawText('Refundable up to 72 hours before the event (minus fees).', {
      x: margin,
      y: margin + 24,
      size: 9,
      font: fontRegular,
      color: rgb(0.42, 0.45, 0.5),
    })
    if (baseUrl) {
      page.drawText(`Support: ${baseUrl}`, {
        x: margin,
        y: margin + 10,
        size: 9,
        font: fontRegular,
        color: rgb(0.42, 0.45, 0.5),
      })
    }

    // Order number small
    page.drawText(`Order: ${orderNumber}`, {
      x: width - margin - 180,
      y: margin + 10,
      size: 9,
      font: fontRegular,
      color: rgb(0.42, 0.45, 0.5),
    })
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
