import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createPayment } from '@/lib/nowpayments'
import { sendTelegramNotification } from '@/lib/telegram'
import { createTicketOrder } from '@/lib/tickets'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, customerName, eventId, ticketTypeId, quantity } = body

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!eventId) return NextResponse.json({ error: 'Event is required' }, { status: 400 })
    if (!ticketTypeId) return NextResponse.json({ error: 'Ticket type is required' }, { status: 400 })

    const qty = Math.max(1, Number(quantity || 1))

    // Validate event + ticket type
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    })
    if (!event || !event.active || !event.published) {
      return NextResponse.json({ error: 'Event not available' }, { status: 404 })
    }

    const ticketType = event.ticketTypes.find((t) => t.id === ticketTypeId && t.active)
    if (!ticketType) {
      return NextResponse.json({ error: 'Invalid ticket type' }, { status: 400 })
    }

    const order = await createTicketOrder({
      email,
      customerName,
      eventId: event.id,
      items: [{ ticketTypeId, qty }],
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const orderData = {
      kind: 'event',
      orderNumber: order.orderNumber,
      email,
      eventSlug: event.slug,
      eventTitle: event.title,
    }

    // Free tickets: skip NOWPayments and mark paid immediately
    if (order.amount <= 0) {
      const updated = await prisma.ticketOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'free',
          paidAmount: 0,
          paidCurrency: 'USD',
          paidAt: new Date(),
        },
        include: { customer: true, event: true, items: { include: { ticketType: true } } },
      })

      // Send ticket email immediately
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
        await import('@/lib/email').then(({ sendTicketEmail }) => sendTicketEmail({ order: updated, baseUrl }))

        await prisma.ticketOrder.update({
          where: { id: updated.id },
          data: { delivered: true, deliveredAt: new Date() },
        })
      } catch (e) {
        console.error('Failed to send free ticket email:', e)
      }

      await sendTelegramNotification(
        `🎟️ <b>FREE TICKET ORDER</b>\n\nOrder: ${updated.orderNumber}\nEvent: ${event.title}\nTicket: ${ticketType.name} x${qty}\nName: ${customerName || 'N/A'}\nEmail: ${email}\nStatus: paid (free)`
      )

      return NextResponse.json({
        success: true,
        orderNumber: updated.orderNumber,
        redirectUrl: `${baseUrl}/tickets/success?order=${updated.orderNumber}`,
        free: true,
      })
    }

    const payment = await createPayment({
      priceAmount: order.amount,
      priceCurrency: 'usd',
      orderId: `${order.orderNumber}|${Buffer.from(JSON.stringify(orderData)).toString('base64')}`,
      orderDescription: `Event Ticket: ${event.title} (${ticketType.name}) x${qty}`,
      successUrl: `${baseUrl}/tickets/success?order=${order.orderNumber}`,
      cancelUrl: `${baseUrl}/events/${event.slug}`,
    })

    await prisma.ticketOrder.update({
      where: { id: order.id },
      data: { paymentId: payment.id?.toString() },
    })

    await sendTelegramNotification(
      `🎟️ <b>NEW TICKET ORDER</b>\n\nOrder: ${order.orderNumber}\nEvent: ${event.title}\nTicket: ${ticketType.name} x${qty}\nName: ${customerName || 'N/A'}\nEmail: ${email}\nStatus: pending`
    )

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      paymentUrl: payment.invoice_url,
    })
  } catch (error) {
    console.error('Ticket checkout error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create ticket payment' }, { status: 500 })
  }
}
