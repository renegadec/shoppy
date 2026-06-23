import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getOmariPaymentStatus, submitOmariPaymentOtp } from '@/lib/omari'
import { fulfillTeloneOrderIfPaid } from '@/lib/teloneFulfillment'

export async function POST(request) {
  try {
    const { orderNumber, otp } = await request.json()
    if (!orderNumber) return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    if (!otp) return NextResponse.json({ error: 'otp is required' }, { status: 400 })

    const order = await prisma.teloneOrder.findUnique({ where: { orderNumber } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.paymentId || !order.ecocashMsisdn) return NextResponse.json({ error: 'Missing Omari payment details for this order' }, { status: 400 })

    const payment = await submitOmariPaymentOtp({ msisdn: order.ecocashMsisdn, reference: order.paymentId, otp })

    await prisma.teloneOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'omari_otp_submitted',
        providerRef: payment?.paymentReference || order.providerRef,
        deliveryNotes: JSON.stringify({ omariPayment: payment }),
      },
    })

    const status = await getOmariPaymentStatus(order.paymentId)
    if (String(status?.status || '').toUpperCase() === 'SUCCESS') {
      await prisma.teloneOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'omari_success',
          paidAt: new Date(),
          paidAmount: status?.amount ?? order.amount,
          paidCurrency: status?.currency ?? order.currency,
          providerRef: status?.paymentReference || payment?.paymentReference || order.providerRef,
        },
      })
      await fulfillTeloneOrderIfPaid({ orderNumber })
    }

    return NextResponse.json({ success: true, payment, status })
  } catch (error) {
    console.error('Omari Telone OTP error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
