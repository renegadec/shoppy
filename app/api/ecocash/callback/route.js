import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram'

/**
 * EcoCash callback/webhook endpoint.
 *
 * NOTE: We need the exact payload + signature scheme from EcoCash docs to do
 * robust verification.
 *
 * For now: accept payload, try to locate the order by reference, and record the
 * raw status.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    console.log('EcoCash callback received:', JSON.stringify(body, null, 2))

    // Attempt common reference keys
    const reference =
      body?.sourceReference ||
      body?.source_reference ||
      body?.clientReference ||
      body?.reference ||
      body?.merchantReference ||
      body?.orderNumber

    const statusRaw = body?.status || body?.paymentStatus || body?.transactionStatus

    if (!reference) {
      await sendTelegramNotification(
        `⚠️ <b>ECOCASH CALLBACK (UNMATCHED)</b>\n\nMissing reference in payload. Check logs.`
      )
      return NextResponse.json({ success: true })
    }

    // Find order by orderNumber OR by paymentId (we store orderNumber as paymentId for ecocash)
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: reference }, { paymentId: reference }],
      },
      include: { product: true, customer: true },
    })

    if (!order) {
      await sendTelegramNotification(
        `⚠️ <b>ECOCASH CALLBACK (ORDER NOT FOUND)</b>\n\nReference: ${reference}`
      )
      return NextResponse.json({ success: true })
    }

    // Map status when we learn the exact values from EcoCash.
    // Safe default: store raw status only.
    const updateData = {
      paymentStatus: `ecocash_${String(statusRaw || 'callback').toLowerCase()}`,
    }

    // Heuristic: treat these as paid
    const paidWords = ['paid', 'success', 'successful', 'complete', 'completed', 'confirmed']
    if (statusRaw && paidWords.some((w) => String(statusRaw).toLowerCase().includes(w))) {
      updateData.status = 'PAID'
      updateData.paidAt = new Date()
      updateData.paidCurrency = order.currency || 'USD'
      updateData.paidAmount = order.amount
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    })

    await sendTelegramNotification(
      `✅ <b>ECOCASH CALLBACK RECEIVED</b>\n\nOrder: ${order.orderNumber}\nStatus: ${statusRaw || 'N/A'}`
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
