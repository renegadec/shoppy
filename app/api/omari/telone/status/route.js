import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getOmariPaymentStatus } from '@/lib/omari'
import { fulfillTeloneOrderIfPaid } from '@/lib/teloneFulfillment'

export async function POST(request) {
  try {
    const { orderNumber } = await request.json()
    if (!orderNumber) return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })

    const order = await prisma.teloneOrder.findUnique({ where: { orderNumber } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.paymentId) return NextResponse.json({ error: 'Missing Omari reference for this order' }, { status: 400 })

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
          providerRef: status?.paymentReference || order.providerRef,
        },
      })
      await fulfillTeloneOrderIfPaid({ orderNumber })
    } else {
      await prisma.teloneOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: `omari_${String(status?.status || 'pending').toLowerCase()}`,
          providerRef: status?.paymentReference || order.providerRef,
        },
      })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Omari Telone status error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
