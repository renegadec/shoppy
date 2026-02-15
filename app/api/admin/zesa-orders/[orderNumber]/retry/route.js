import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { fulfillZesaOrderIfPaid } from '@/lib/zesaFulfillment'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderNumber } = await params
    if (!orderNumber) return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })

    const order = await prisma.zesaOrder.findUnique({ where: { orderNumber } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Only retry if payment is confirmed but delivery not done.
    if (order.status !== 'PAID' || order.delivered) {
      return NextResponse.json({
        ok: false,
        message: 'Retry not allowed unless status=PAID and delivered=false',
        status: order.status,
        delivered: order.delivered,
      })
    }

    await fulfillZesaOrderIfPaid({ orderNumber })

    const updated = await prisma.zesaOrder.findUnique({ where: { orderNumber }, include: { customer: true } })
    return NextResponse.json({ ok: true, order: updated })
  } catch (e) {
    console.error('Retry ZESA fulfillment error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
