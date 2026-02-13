import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEcoCashC2BTransactionStatus } from '@/lib/ecocashStatus'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderNumber } = body

    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // For EcoCash we store sourceReference in paymentId.
    const sourceReference = order.paymentId
    const sourceMobileNumber = order.ecocashMsisdn

    if (!sourceReference || !sourceMobileNumber) {
      return NextResponse.json(
        { error: 'Missing EcoCash reference or mobile number for this order' },
        { status: 400 }
      )
    }

    const status = await getEcoCashC2BTransactionStatus({
      sourceMobileNumber,
      sourceReference,
    })

    // Update local order status if paid
    const s = String(status?.status || '').toUpperCase()
    if (s === 'SUCCESS') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'ecocash_success',
          paidAt: new Date(),
          paidAmount: status?.amount?.amount ?? order.amount,
          paidCurrency: status?.amount?.currency ?? order.currency,
          // keep provider refs in paymentStatus or deliveryNotes? (we'll pack them into paymentStatus for now)
        },
      })
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: `ecocash_${String(status?.status || 'unknown').toLowerCase()}`,
        },
      })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('EcoCash status route error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'EcoCash status endpoint active' })
}
