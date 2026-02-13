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

    const order = await prisma.ticketOrder.findUnique({
      where: { orderNumber },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
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

    const s = String(status?.status || '').toUpperCase()
    if (s === 'SUCCESS') {
      await prisma.ticketOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'ecocash_success',
          paidAt: new Date(),
          paidAmount: status?.amount?.amount ?? order.amount,
          paidCurrency: status?.amount?.currency ?? order.currency,
          providerRef: status?.ecocashReference || order.providerRef,
        },
      })
    } else {
      await prisma.ticketOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: `ecocash_${String(status?.status || 'unknown').toLowerCase()}`,
          providerRef: status?.ecocashReference || order.providerRef,
        },
      })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('EcoCash ticket status route error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'EcoCash ticket status endpoint active' })
}
