import prisma from './prisma'

/**
 * Generate a human-readable ticket order number
 * Format: EVT-YYYYMMDD-XXX (e.g., EVT-20260212-001)
 */
export async function generateTicketOrderNumber() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `EVT-${dateStr}-`

  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setHours(23, 59, 59, 999)

  const count = await prisma.ticketOrder.count({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  })

  const sequence = String(count + 1).padStart(3, '0')
  return `${prefix}${sequence}`
}

function makeTicketCode() {
  // short-ish unique code for human support
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const ts = Date.now().toString(36).slice(-4).toUpperCase()
  return `SHP-${ts}-${rand}`
}

export async function createTicketOrder({
  email,
  eventId,
  items, // [{ ticketTypeId, qty }]
}) {
  if (!email) throw new Error('Email is required')
  if (!eventId) throw new Error('Event is required')
  if (!items?.length) throw new Error('No ticket items provided')

  // Find or create customer
  let customer = await prisma.customer.findUnique({ where: { email } })
  if (!customer) {
    customer = await prisma.customer.create({ data: { email } })
  }

  // Load event + ticket types
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: true },
  })
  if (!event || !event.active || !event.published) throw new Error('Event not available')

  const ticketTypeMap = new Map(event.ticketTypes.map((t) => [t.id, t]))

  let amount = 0
  const expanded = []
  for (const line of items) {
    const tt = ticketTypeMap.get(line.ticketTypeId)
    if (!tt || !tt.active) throw new Error('Invalid ticket type')
    const qty = Math.max(1, Number(line.qty || 1))
    amount += tt.price * qty
    expanded.push({ tt, qty })
  }

  const orderNumber = await generateTicketOrderNumber()

  const order = await prisma.ticketOrder.create({
    data: {
      orderNumber,
      amount,
      currency: 'USD',
      customerId: customer.id,
      eventId: event.id,
      items: {
        create: expanded.flatMap(({ tt, qty }) => {
          return Array.from({ length: qty }).map(() => {
            const ticketCode = makeTicketCode()
            const qrPayload = JSON.stringify({
              kind: 'ticket',
              orderNumber,
              ticketCode,
              eventSlug: event.slug,
              ticketType: tt.name,
            })
            return {
              ticketTypeId: tt.id,
              ticketCode,
              qrPayload,
            }
          })
        }),
      },
    },
    include: {
      customer: true,
      event: true,
      items: { include: { ticketType: true } },
    },
  })

  return order
}

export async function updateTicketOrderFromWebhook({
  paymentId,
  orderNumber,
  status,
  paidAmount,
  paidCurrency,
}) {
  const statusMap = {
    waiting: 'PENDING',
    confirming: 'PROCESSING',
    confirmed: 'PAID',
    sending: 'PROCESSING',
    partially_paid: 'PARTIALLY_PAID',
    finished: 'PAID',
    failed: 'FAILED',
    refunded: 'REFUNDED',
    expired: 'EXPIRED',
  }

  const orderStatus = statusMap[status] || 'PENDING'
  const isPaid = ['confirmed', 'finished'].includes(status)

  let order = null
  if (paymentId) {
    order = await prisma.ticketOrder.findFirst({ where: { paymentId } })
  }
  if (!order && orderNumber) {
    order = await prisma.ticketOrder.findUnique({ where: { orderNumber } })
  }
  if (!order) return null

  return prisma.ticketOrder.update({
    where: { id: order.id },
    data: {
      status: orderStatus,
      paymentStatus: status,
      paidAmount,
      paidCurrency,
      ...(isPaid && { paidAt: new Date() }),
    },
    include: {
      customer: true,
      event: true,
      items: { include: { ticketType: true } },
    },
  })
}
