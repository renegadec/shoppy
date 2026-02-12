import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export async function buildTicketsPdf({ order, baseUrl }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 })

  const chunks = []
  doc.on('data', (c) => chunks.push(c))

  const title = order?.event?.title || 'Event'
  const name = order?.customer?.name || 'Attendee'
  const orderNumber = order?.orderNumber || ''

  doc.fontSize(18).text('Shoppy Tickets', { align: 'left' })
  doc.moveDown(0.25)
  doc.fontSize(12).fillColor('#111111').text(`Event: ${title}`)
  doc.text(`Name: ${name}`)
  doc.text(`Order: ${orderNumber}`)
  doc.moveDown(0.5)
  doc.fillColor('#444444').fontSize(10).text('Show these QR codes at entry. Keep this PDF safe.')
  doc.moveDown(0.75)

  for (let i = 0; i < (order.items || []).length; i++) {
    const it = order.items[i]
    const ticketType = it.ticketType?.name || 'Ticket'

    const pngDataUrl = await QRCode.toDataURL(it.qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 520,
    })
    const pngBase64 = pngDataUrl.split(',')[1]
    const pngBuffer = Buffer.from(pngBase64, 'base64')

    // Card
    const cardTop = doc.y
    doc
      .roundedRect(40, cardTop, 515, 170, 14)
      .lineWidth(1)
      .strokeColor('#E5E7EB')
      .stroke()

    doc.fontSize(12).fillColor('#111111').text(ticketType, 60, cardTop + 18)
    doc.fontSize(10).fillColor('#444444').text(`Ticket code: ${it.ticketCode}`, 60, cardTop + 40)

    doc.image(pngBuffer, 400, cardTop + 20, { width: 120, height: 120 })

    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text('Refundable up to 72 hours before the event (minus fees).', 60, cardTop + 70, {
        width: 310,
      })

    if (baseUrl) {
      doc
        .fontSize(9)
        .fillColor('#6B7280')
        .text(`Support: ${baseUrl}`, 60, cardTop + 95, { width: 310 })
    }

    doc.y = cardTop + 190

    // Page break if needed
    if (i < (order.items || []).length - 1 && doc.y > 640) {
      doc.addPage()
    }
  }

  doc.end()

  const buffer = await new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  return buffer
}
