import fs from 'node:fs'
import path from 'node:path'
import { buildTicketsPdf } from '../lib/pdf.js'

const outDir = path.join(process.cwd(), 'tmp')
fs.mkdirSync(outDir, { recursive: true })

const order = {
  orderNumber: 'EVT-TEST-001',
  customer: { name: 'Test Attendee', email: 'test@example.com' },
  event: {
    title: 'Sample Event Title',
    subtitle: 'Harare • Live',
    description: 'A demo event used to preview ticket PDF layout.',
    startsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000 + 2 * 3600 * 1000).toISOString(),
    venue: '7 Arts Theatre',
    city: 'Harare',
    organizerName: 'Shoppy',
    // Random placeholder banner for layout preview
    image: 'https://picsum.photos/1200/420',
  },
  items: [
    {
      ticketCode: 'TCK-ABC123',
      qrPayload: 'shoppy://ticket/TCK-ABC123',
      ticketType: { name: 'General Admission' },
    },
  ],
}

const pdf = await buildTicketsPdf({ order, baseUrl: 'https://www.shoppy.co.zw' })
const pdfPath = path.join(outDir, 'ticket-preview.pdf')
fs.writeFileSync(pdfPath, pdf)
console.log('Wrote', pdfPath)
