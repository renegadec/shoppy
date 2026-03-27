import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getOmariPaymentStatus } from '@/lib/omari'
import { sendTelegramNotification } from '@/lib/telegram'
import { sendTicketEmail } from '@/lib/email'

async function deliverIfNeeded(orderId, status) {
  const updated = await prisma.ticketOrder.findUnique({
    where: { id: orderId },
    include: { customer: true, event: true, items: { include: { ticketType: true } } },
  })

  if (updated && !updated.delivered) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    await sendTicketEmail({ order: updated, baseUrl })
    await prisma.ticketOrder.update({ where: { id: updated.id }, data: { delivered: true, deliveredAt: new Date() } })
    await sendTelegramNotification(`✅ <b>OMARI TICKET PAYMENT CONFIRMED</b>

Order: ${updated.orderNumber}
Event: ${updated.event?.title || 'Event'}
Email: ${updated.customer?.email || 'N/A'}
Ref: ${status?.paymentReference || 'N/A'}`)
  }
}

export async function POST(request) {
  try {
    const { orderNumber } = await request.json()
    if (!orderNumber) return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    const order = await prisma.ticketOrder.findUnique({ where: { orderNumber } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.paymentId) return NextResponse.json({ error: 'Missing Omari reference for this order' }, { status: 400 })
    const status = await getOmariPaymentStatus(order.paymentId)
    if (String(status?.status || '').toUpperCase() === 'SUCCESS') {
      await prisma.ticketOrder.update({ where: { id: order.id }, data: { status: 'PAID', paymentStatus: 'omari_success', paidAt: new Date(), paidAmount: status?.amount ?? order.amount, paidCurrency: status?.currency ?? order.currency, providerRef: status?.paymentReference || order.providerRef } })
      await deliverIfNeeded(order.id, status)
    } else {
      await prisma.ticketOrder.update({ where: { id: order.id }, data: { paymentStatus: `omari_${String(status?.status || 'pending').toLowerCase()}`, providerRef: status?.paymentReference || order.providerRef } })
    }
    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Omari ticket status error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
