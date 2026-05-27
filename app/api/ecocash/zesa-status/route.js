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
        { error: 'Missing EcoCash reference or mobile number for this order' },
        { status: 400 }
      )
    }

    const status = await getEcoCashC2BTransactionStatus({
      sourceMobileNumber,
      sourceReference,
    })

    if (isEcoCashPaidStatus(status)) {
      await prisma.zesaOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'ecocash_success',
          paidAt: new Date(),
          paidAmount: getEcoCashPaidAmount(status, order.amount),
          paidCurrency: getEcoCashPaidCurrency(status, order.currency),
          providerRef: getEcoCashProviderRef(status, order.providerRef),
        },
      })

      // Trigger fulfillment, but don't fail payment confirmation if the
      // downstream ZESA provider has an issue. Admin can retry fulfillment.
      try {
        await fulfillZesaOrderIfPaid({ orderNumber })
      } catch (fulfillmentError) {
        console.error('EcoCash ZESA fulfillment failed after payment confirmation:', fulfillmentError)
      }

    } else {
      await prisma.zesaOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: `ecocash_${getEcoCashPaymentStatusSlug(status)}`,
          providerRef: getEcoCashProviderRef(status, order.providerRef),
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
