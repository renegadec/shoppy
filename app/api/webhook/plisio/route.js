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

async function parsePlisioBody(request) {
  // Plisio callbacks may be JSON or form-encoded. Handle both.
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return await request.json().catch(() => ({}))
  }

  const raw = await request.text().catch(() => '')
  if (!raw) return {}

  // Try form-encoded first
  try {
    const params = new URLSearchParams(raw)
    const obj = {}
    for (const [k, v] of params.entries()) obj[k] = v
    if (Object.keys(obj).length) return obj
  } catch {
    // ignore
  }

  // Fallback: try JSON parse
  try {
    return JSON.parse(raw)
  } catch {
    return { raw }
  }
}

function extractOperationId(payload) {
  return (
    payload?.txn_id ||
    payload?.txnId ||
    payload?.id ||
    payload?.operation_id ||
    payload?.operationId ||
    payload?.invoice_id ||
    payload?.invoiceId ||
    payload?.verify_hash ||
    payload?.verifyHash ||
    null
  )
}

async function handlePlisioCallback(payload) {
  // Plisio callback payload formats vary by integration.
  const operationId = extractOperationId(payload)

  if (!operationId) {
    console.error('Plisio webhook: missing operation id', payload)
    // Return 200 so Plisio doesn't keep retrying endlessly; we still log for debugging.
    return NextResponse.json({ success: true, ignored: true, error: 'Missing operation id' })
  }

  // Best-effort verification: fetch canonical operation details from Plisio API.
  const opResp = await getOperation(operationId)
  const op = opResp?.data || opResp?.operation || opResp?.response || opResp?.result || null

  const status = op?.status || opResp?.status || payload?.status
  const orderNumber =
    op?.operationParams?.orderNumber ||
    payload?.order_number ||
    payload?.orderNumber ||
    payload?.order_id ||
    payload?.orderId

  if (!orderNumber) {
    console.error('Plisio webhook: missing order number', { payload, opResp })
    return NextResponse.json({ success: true, ignored: true, error: 'Missing order number' })
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
}

export async function POST(request) {
  try {
    const payload = await parsePlisioBody(request)
    console.log('Plisio webhook received:', JSON.stringify(payload))
    return await handlePlisioCallback(payload)
  } catch (error) {
    console.error('Plisio webhook error:', error)
    return NextResponse.json({ success: true, error: error.message })
  }
}

export async function GET(request) {
  try {
    // Some gateways send callbacks via GET with query params.
    const url = new URL(request.url)
    const payload = {}
    for (const [k, v] of url.searchParams.entries()) payload[k] = v

    if (Object.keys(payload).length) {
      console.log('Plisio webhook GET received:', JSON.stringify(payload))
      return await handlePlisioCallback(payload)
    }

    return NextResponse.json({ status: 'Plisio webhook endpoint active' })
  } catch (error) {
    console.error('Plisio webhook GET error:', error)
    return NextResponse.json({ status: 'error', error: error.message })
  }
}
