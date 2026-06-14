import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  getEcoCashC2BTransactionStatus,
  getEcoCashPaidAmount,
  getEcoCashPaidCurrency,
  getEcoCashPaymentStatusSlug,
  getEcoCashProviderRef,
  isEcoCashPaidStatus,
} from '@/lib/ecocashStatus'
import { sendTelegramNotification } from '@/lib/telegram'
import { sendTicketEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderNumber } = body

    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    }

    const order = await prisma.ticketOrder.findUnique({
      where: { orderNumber },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status === 'PAID' || order.paymentStatus === 'ecocash_success') {
      return NextResponse.json({
        success: true,
        status: { transactionOperationStatus: 'COMPLETED', ecocashReference: order.providerRef },
        order,
      })
    }

    const sourceReference = order.paymentId
    const sourceMobileNumber = order.ecocashMsisdn

    if (!sourceReference || !sourceMobileNumber) {
      return NextResponse.json(
        { error: 'Missing EcoCash reference or mobile number for this ticket order' },
        { status: 400 }
      )
    }

    const status = await getEcoCashC2BTransactionStatus({
      sourceMobileNumber,
      sourceReference,
    })

    if (isEcoCashPaidStatus(status)) {
      const updated = await prisma.ticketOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'ecocash_success',
          paidAt: new Date(),
          paidAmount: getEcoCashPaidAmount(status, order.amount),
          paidCurrency: getEcoCashPaidCurrency(status, order.currency),
          providerRef: getEcoCashProviderRef(status, order.providerRef),
        },
        include: { customer: true, event: true, items: { include: { ticketType: true } } },
      })

      // Send tickets by email once (idempotent)
      if (!updated.delivered) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
        try {
          await sendTicketEmail({ order: updated, baseUrl })

          await prisma.ticketOrder.update({
            where: { id: updated.id },
            data: { delivered: true, deliveredAt: new Date() },
          })

          await sendTelegramNotification(
            `✅ <b>ECOCASH TICKET PAYMENT CONFIRMED</b>\n\nOrder: ${updated.orderNumber}\nEvent: ${updated.event?.title || 'Event'}\nEmail: ${updated.customer?.email || 'N/A'}\nRef: ${status?.ecocashReference || 'N/A'}`
          )
        } catch (e) {
          console.error('Failed to send ticket email (EcoCash):', e)
          await sendTelegramNotification(
            `⚠️ <b>ECOCASH TICKET EMAIL FAILED</b>\n\nOrder: ${updated.orderNumber}\nReason: ${e?.message || 'Unknown error'}`
          )
        }
      }

    } else {
      await prisma.ticketOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: `ecocash_${getEcoCashPaymentStatusSlug(status)}`,
          providerRef: getEcoCashProviderRef(status, order.providerRef),
        },
      })
    }

    const latest = await prisma.ticketOrder.findUnique({ where: { orderNumber } })
    return NextResponse.json({ success: true, status, order: latest })
  } catch (error) {
    console.error('EcoCash ticket status route error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'EcoCash ticket status endpoint active' })
}
