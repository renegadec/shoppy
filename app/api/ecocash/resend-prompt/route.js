import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createEcoCashInstantC2BPayment } from '@/lib/ecocash'

function nowMinusMs(d) {
  try {
    return Date.now() - new Date(d).getTime()
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const kind = String(body.kind || 'product')
    const orderNumber = String(body.orderNumber || '')

    if (!orderNumber) return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })

    const base = {
      where: { orderNumber },
    }

    const model =
      kind === 'ticket'
        ? 'ticketOrder'
        : kind === 'airtime'
          ? 'airtimeOrder'
          : kind === 'zesa'
            ? 'zesaOrder'
            : 'order'

    const order = await prisma[model].findUnique(base)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.paymentMethod !== 'ecocash') {
      return NextResponse.json({ error: 'This order is not EcoCash' }, { status: 400 })
    }

    // Prevent duplicates: only for unpaid/pending.
    if (order.status === 'PAID' || order.delivered) {
      return NextResponse.json({ error: 'Order already paid/delivered' }, { status: 400 })
    }

    // Throttle: 2 minutes between prompt attempts.
    if (order.updatedAt && nowMinusMs(order.updatedAt) < 120_000) {
      return NextResponse.json({ error: 'Please wait a moment before requesting another prompt.' }, { status: 429 })
    }

    const msisdn = order.ecocashMsisdn
    if (!msisdn) return NextResponse.json({ error: 'Missing EcoCash MSISDN for this order' }, { status: 400 })

    const sourceReference = crypto.randomUUID()

    await createEcoCashInstantC2BPayment({
      customerMsisdn: msisdn,
      amount: Number(order.amount),
      currency: order.currency || 'USD',
      reason: `${order.orderNumber} - Payment retry`,
      sourceReference,
    })

    await prisma[model].update({
      where: { id: order.id },
      data: {
        paymentId: sourceReference,
        paymentStatus: 'ecocash_initiated',
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('EcoCash resend prompt error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
