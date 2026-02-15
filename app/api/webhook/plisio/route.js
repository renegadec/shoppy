import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getOperation } from '@/lib/plisio'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'
import { updateOrderFromWebhook } from '@/lib/orders'
import { updateTicketOrderFromWebhook } from '@/lib/tickets'
import { sendTicketEmail } from '@/lib/email'
import { fulfillAirtimeOrderIfPaid } from '@/lib/airtimeFulfillment'
import { fulfillZesaOrderIfPaid } from '@/lib/zesaFulfillment'

function isPaidStatus(status) {
  const s = String(status || '').toLowerCase()
  return ['completed', 'confirmed', 'finished', 'success', 'paid'].includes(s)
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    // Plisio callback payload formats vary by integration.
    // Commonly includes txn_id (operation id). We'll fall back to id/txnId.
    const operationId = body.txn_id || body.txnId || body.id

    if (!operationId) {
      console.error('Plisio webhook: missing operation id', body)
      return NextResponse.json({ success: false, error: 'Missing operation id' }, { status: 400 })
    }

    // Best-effort verification: fetch canonical operation details from Plisio API.
    const opResp = await getOperation(operationId)
    const op = opResp?.data || opResp?.operation || opResp?.response || opResp?.result || opResp?.operation || opResp?.operation

    const status = op?.status || opResp?.status || body.status
    const orderNumber = op?.operationParams?.orderNumber || body.order_number || body.orderNumber

    if (!orderNumber) {
      console.error('Plisio webhook: missing order number', { body, opResp })
      return NextResponse.json({ success: false, error: 'Missing order number' }, { status: 400 })
    }

    // Detect order kind
    let isTicketOrder = String(orderNumber).startsWith('EVT-')
    let isAirtimeOrder = String(orderNumber).startsWith('AIR-')
    let isZesaOrder = String(orderNumber).startsWith('ZESA-')

    if (!isTicketOrder && !isAirtimeOrder && !isZesaOrder) {
      const [a, z, t] = await Promise.all([
        prisma.airtimeOrder.findUnique({ where: { orderNumber }, select: { id: true } }).catch(() => null),
        prisma.zesaOrder.findUnique({ where: { orderNumber }, select: { id: true } }).catch(() => null),
        prisma.ticketOrder.findUnique({ where: { orderNumber }, select: { id: true } }).catch(() => null),
      ])
      if (t) isTicketOrder = true
      if (a) isAirtimeOrder = true
      if (z) isZesaOrder = true
    }

    const paidAmount = Number(op?.actualSum || op?.sum || body.amount || body.paid_amount || 0) || null
    const paidCurrency = op?.psysCid || op?.currency || body.currency || null

    const updatedOrder = isTicketOrder
      ? await updateTicketOrderFromWebhook({
          paymentId: String(operationId),
          orderNumber,
          status,
          paidAmount,
          paidCurrency,
        })
      : isAirtimeOrder
        ? await prisma.airtimeOrder
            .update({
              where: { orderNumber },
              data: {
                status: isPaidStatus(status) ? 'PAID' : 'PENDING',
                paymentStatus: String(status),
                paidAmount,
                paidCurrency,
                ...(isPaidStatus(status) ? { paidAt: new Date() } : {}),
              },
              include: { customer: true },
            })
            .catch(() => null)
        : isZesaOrder
          ? await prisma.zesaOrder
              .update({
                where: { orderNumber },
                data: {
                  status: isPaidStatus(status) ? 'PAID' : 'PENDING',
                  paymentStatus: String(status),
                  paidAmount,
                  paidCurrency,
                  ...(isPaidStatus(status) ? { paidAt: new Date() } : {}),
                },
                include: { customer: true },
              })
              .catch(() => null)
          : await updateOrderFromWebhook({
              paymentId: String(operationId),
              orderNumber,
              status,
              paidAmount,
              paidCurrency,
            })

    if (isPaidStatus(status)) {
      if (isAirtimeOrder) {
        await sendTelegramNotification(`✅ <b>AIRTIME PAYMENT CONFIRMED (PLISIO)</b>\n\nOrder: ${orderNumber}`)
        try {
          await fulfillAirtimeOrderIfPaid({ orderNumber })
        } catch (e) {
          console.error('Airtime fulfillment failed:', e)
        }

      } else if (isZesaOrder) {
        await sendTelegramNotification(`✅ <b>ZESA PAYMENT CONFIRMED (PLISIO)</b>\n\nOrder: ${orderNumber}`)
        try {
          await fulfillZesaOrderIfPaid({ orderNumber })
        } catch (e) {
          console.error('ZESA fulfillment failed:', e)
        }

      } else if (isTicketOrder) {
        await sendTelegramNotification(`✅ <b>TICKET PAYMENT CONFIRMED (PLISIO)</b>\n\nOrder: ${orderNumber}`)
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
          await sendTicketEmail({ order: updatedOrder, baseUrl })
          await prisma.ticketOrder.update({
            where: { id: updatedOrder.id },
            data: { delivered: true, deliveredAt: new Date() },
          })
        } catch (e) {
          console.error('Failed to send ticket email:', e)
          await sendTelegramNotification(`⚠️ <b>TICKET EMAIL FAILED</b>\n\nOrder: ${orderNumber}\nReason: ${e?.message || 'Unknown error'}`)
        }

      } else {
        await sendTelegramNotification(
          formatOrderNotification({
            orderId: orderNumber,
            productName: updatedOrder?.product?.name || 'Unknown Product',
            amount: updatedOrder?.amount || null,
            email: updatedOrder?.customer?.email || 'N/A',
            contactMethod: 'email',
            contactValue: updatedOrder?.customer?.email || 'N/A',
            paymentStatus: 'confirmed',
          })
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plisio webhook error:', error)
    return NextResponse.json({ success: true, error: error.message })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Plisio webhook endpoint active' })
}
