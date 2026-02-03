import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/nowpayments'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'
import { updateOrderFromWebhook } from '@/lib/orders'

export async function POST(request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-nowpayments-sig')

    // Verify webhook signature (optional but recommended)
    if (process.env.NOWPAYMENTS_IPN_SECRET) {
      const isValid = verifyWebhookSignature(body, signature)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    console.log('Webhook received:', JSON.stringify(body, null, 2))

    const { 
      payment_id,
      payment_status, 
      order_id, 
      price_amount,
      actually_paid,
      pay_currency,
    } = body

    // Parse order data from order_id
    let orderNumber = order_id
    let orderData = {}

    if (order_id && order_id.includes('|')) {
      const [id, encoded] = order_id.split('|')
      orderNumber = id
      try {
        orderData = JSON.parse(Buffer.from(encoded, 'base64').toString())
      } catch (e) {
        console.error('Failed to parse order data:', e)
      }
    }

    // Update order in database
    const updatedOrder = await updateOrderFromWebhook({
      paymentId: payment_id?.toString(),
      orderNumber,
      status: payment_status,
      paidAmount: actually_paid,
      paidCurrency: pay_currency
    })

    // Handle different payment statuses
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      console.log(`✅ Payment confirmed for order ${orderNumber}`)

      // Send Telegram notification
      await sendTelegramNotification(
        formatOrderNotification({
          orderId: orderNumber,
          productName: updatedOrder?.product?.name || orderData.productName || 'Unknown Product',
          amount: price_amount,
          email: updatedOrder?.customer?.email || orderData.email || 'N/A',
          contactMethod: updatedOrder?.contactMethod || orderData.contactMethod || 'email',
          contactValue: updatedOrder?.contactValue || orderData.contactValue || orderData.email || 'N/A',
          paymentStatus: 'confirmed',
        })
      )

    } else if (payment_status === 'partially_paid') {
      await sendTelegramNotification(
        `⚠️ <b>PARTIAL PAYMENT</b>\n\nOrder: ${orderNumber}\nExpected: $${price_amount}\nReceived: ${actually_paid} ${pay_currency}\n\nCustomer needs to pay the difference.`
      )

    } else if (payment_status === 'failed' || payment_status === 'expired') {
      await sendTelegramNotification(
        `❌ <b>PAYMENT ${payment_status.toUpperCase()}</b>\n\nOrder: ${orderNumber}\nAmount: $${price_amount}\n\nNo action needed.`
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: true, error: error.message })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
