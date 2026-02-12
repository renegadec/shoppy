import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createPayment } from '@/lib/nowpayments'
import { sendTelegramNotification } from '@/lib/telegram'
import { createTicketOrder } from '@/lib/tickets'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, eventId, ticketTypeId, quantity } = body

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
      `🎟️ <b>NEW TICKET ORDER</b>\n\nOrder: ${order.orderNumber}\nEvent: ${event.title}\nTicket: ${ticketType.name} x${qty}\nAmount: $${order.amount}\nEmail: ${email}\nStatus: pending`
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
