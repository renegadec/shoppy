import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEcoCashC2BTransactionStatus } from '@/lib/ecocashStatus'
import { fulfillZesaOrderIfPaid } from '@/lib/zesaFulfillment'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderNumber } = body

    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    }

    const order = await prisma.zesaOrder.findUnique({ where: { orderNumber } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

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

    const s = String(status?.status || '').toUpperCase()

    if (s === 'SUCCESS') {
      await prisma.zesaOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'ecocash_success',
          paidAt: new Date(),
          paidAmount: status?.amount?.amount ?? order.amount,
          paidCurrency: status?.amount?.currency ?? order.currency,
        },
      })

      await fulfillZesaOrderIfPaid({ orderNumber })

    } else {
      await prisma.zesaOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: `ecocash_${String(status?.status || 'unknown').toLowerCase()}`,
        },
      })
    }

    const updated = await prisma.zesaOrder.findUnique({ where: { orderNumber } })
    return NextResponse.json({ success: true, status, order: updated })
  } catch (e) {
    console.error('EcoCash ZESA status route error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
