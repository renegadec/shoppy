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
import { fulfillAirtimeOrderIfPaid } from '@/lib/airtimeFulfillment'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderNumber } = body

    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 })
    }

    const order = await prisma.airtimeOrder.findUnique({
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
        { error: 'Missing EcoCash reference or mobile number for this order' },
        { status: 400 }
      )
    }

    const status = await getEcoCashC2BTransactionStatus({
      sourceMobileNumber,
      sourceReference,
    })

    if (isEcoCashPaidStatus(status)) {
      await prisma.airtimeOrder.update({
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
      // downstream airtime provider has an issue. Admin can retry fulfillment.
      try {
        await fulfillAirtimeOrderIfPaid({ orderNumber })
      } catch (fulfillmentError) {
        console.error('EcoCash airtime fulfillment failed after payment confirmation:', fulfillmentError)
      }

    } else {
      await prisma.airtimeOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: `ecocash_${getEcoCashPaymentStatusSlug(status)}`,
          providerRef: getEcoCashProviderRef(status, order.providerRef),
        },
      })
    }

    const updated = await prisma.airtimeOrder.findUnique({ where: { orderNumber } })
    return NextResponse.json({ success: true, status, order: updated })
  } catch (error) {
    console.error('EcoCash airtime status route error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
