import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram'
import { sendTicketEmail } from '@/lib/email'
import { fulfillAirtimeOrderIfPaid } from '@/lib/airtimeFulfillment'
import { fulfillZesaOrderIfPaid } from '@/lib/zesaFulfillment'
import { fulfillTeloneOrderIfPaid } from '@/lib/teloneFulfillment'
import {
  getEcoCashPaidAmount,
  getEcoCashPaidCurrency,
  getEcoCashPaymentStatusSlug,
  getEcoCashProviderRef,
  isEcoCashPaidStatus,
} from '@/lib/ecocashStatus'

/**
 * EcoCash callback/webhook endpoint.
 *
 * EcoCash V3 posts the final amountTransaction body to notifyUrl when
 * transactionOperationStatus changes to COMPLETED or FAILED.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    console.log('EcoCash callback received:', JSON.stringify(body, null, 2))

    const reference =
      body?.clientCorrelator ||
      body?.referenceCode ||
      body?.sourceReference ||
      body?.source_reference ||
      body?.clientReference ||
      body?.reference ||
      body?.merchantReference ||
      body?.serverReferenceCode ||
      body?.orderNumber

    if (!reference) {
      await sendTelegramNotification(
        `⚠️ <b>ECOCASH CALLBACK (UNMATCHED)</b>\n\nMissing reference in payload. Check logs.`
      )
      return NextResponse.json({ success: true })
    }

    const matchWhere = {
      OR: [{ orderNumber: reference }, { paymentId: reference }],
    }

    const productOrder = await prisma.order.findFirst({
      where: matchWhere,
      include: { product: true, customer: true },
    })
    const airtimeOrder = productOrder ? null : await prisma.airtimeOrder.findFirst({ where: matchWhere })
    const zesaOrder = productOrder || airtimeOrder ? null : await prisma.zesaOrder.findFirst({ where: matchWhere })
    const teloneOrder = productOrder || airtimeOrder || zesaOrder || ticketOrder
      ? null
      : await prisma.teloneOrder.findFirst({ where: matchWhere })

    const order = productOrder || airtimeOrder || zesaOrder || ticketOrder || teloneOrder
    if (!order) {
      await sendTelegramNotification(
        `⚠️ <b>ECOCASH CALLBACK (ORDER NOT FOUND)</b>\n\nReference: ${reference}`
      )
      return NextResponse.json({ success: true })
    }

    const paid = isEcoCashPaidStatus(body)
    const paymentStatus = paid ? 'ecocash_success' : `ecocash_${getEcoCashPaymentStatusSlug(body)}`
    const updateData = {
      paymentStatus,
      providerRef: getEcoCashProviderRef(body, order.providerRef),
      ...(paid
        ? {
            status: 'PAID',
            paidAt: new Date(),
            paidAmount: getEcoCashPaidAmount(body, order.amount),
            paidCurrency: getEcoCashPaidCurrency(body, order.currency),
          }
        : {}),
    }

    let updatedOrder = null
    let kind = 'product'

    if (productOrder) {
      updatedOrder = await prisma.order.update({
        where: { id: productOrder.id },
        data: updateData,
        include: { product: true, customer: true },
      })
    } else if (airtimeOrder) {
      kind = 'airtime'
      updatedOrder = await prisma.airtimeOrder.update({ where: { id: airtimeOrder.id }, data: updateData })
      if (paid) {
        try {
          await fulfillAirtimeOrderIfPaid({ orderNumber: updatedOrder.orderNumber })
        } catch (e) {
          console.error('EcoCash airtime fulfillment failed:', e)
        }
      }
    } else if (zesaOrder) {
      kind = 'zesa'
      updatedOrder = await prisma.zesaOrder.update({ where: { id: zesaOrder.id }, data: updateData })
      if (paid) {
        try {
          await fulfillZesaOrderIfPaid({ orderNumber: updatedOrder.orderNumber })
        } catch (e) {
          console.error('EcoCash ZESA fulfillment failed:', e)
        }
      }
    } else if (teloneOrder) {
      kind = 'telone'
      updatedOrder = await prisma.teloneOrder.update({ where: { id: teloneOrder.id }, data: updateData })
      if (paid) {
        try {
          await fulfillTeloneOrderIfPaid({ orderNumber: updatedOrder.orderNumber })
        } catch (e) {
          console.error('EcoCash Telone fulfillment failed:', e)
        }
      }
    } else if (ticketOrder) {
      kind = 'ticket'
      updatedOrder = await prisma.ticketOrder.update({
        where: { id: ticketOrder.id },
        data: updateData,
        include: { customer: true, event: true, items: { include: { ticketType: true } } },
      })

      if (paid && !updatedOrder.delivered) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
          await sendTicketEmail({ order: updatedOrder, baseUrl })
          updatedOrder = await prisma.ticketOrder.update({
            where: { id: updatedOrder.id },
            data: { delivered: true, deliveredAt: new Date() },
            include: { customer: true, event: true, items: { include: { ticketType: true } } },
          })
        } catch (e) {
          console.error('Failed to send ticket email (EcoCash callback):', e)
          await sendTelegramNotification(
            `⚠️ <b>ECOCASH TICKET EMAIL FAILED</b>\n\nOrder: ${updatedOrder.orderNumber}\nReason: ${e?.message || 'Unknown error'}`
          )
        }
      }
    }

    await sendTelegramNotification(
      `${paid ? '✅' : '⚠️'} <b>ECOCASH CALLBACK RECEIVED</b>\n\nOrder: ${updatedOrder.orderNumber}\nType: ${kind}\nStatus: ${body?.transactionOperationStatus || 'N/A'}`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('EcoCash callback error:', error)
    return NextResponse.json({ success: true, error: error.message })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'EcoCash callback endpoint active' })
}
