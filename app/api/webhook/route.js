import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/nowpayments'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'

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
      payment_status, 
      order_id, 
      price_amount,
      actually_paid,
      pay_currency,
    } = body

    // Parse order data from order_id
    let orderId = order_id
    let orderData = {}

    if (order_id && order_id.includes('|')) {
      const [id, encoded] = order_id.split('|')
      orderId = id
      try {
        orderData = JSON.parse(Buffer.from(encoded, 'base64').toString())
      } catch (e) {
        console.error('Failed to parse order data:', e)
      }
    }

    // Handle different payment statuses
    // NOWPayments statuses: waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
    
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      // Payment successful!
      console.log(`✅ Payment confirmed for order ${orderId}`)

      // Send Telegram notification
      await sendTelegramNotification(
        formatOrderNotification({
          orderId,
          productName: orderData.productName || 'Unknown Product',
          amount: price_amount,
          email: orderData.email || 'N/A',
          contactMethod: orderData.contactMethod || 'email',
          contactValue: orderData.contactValue || orderData.email || 'N/A',
          paymentStatus: 'confirmed',
        })
      )

      // In production, you'd also:
      // - Update order status in database
      // - Send confirmation email to customer
      // - Potentially auto-deliver digital product

    } else if (payment_status === 'partially_paid') {
      // Customer didn't pay full amount
      await sendTelegramNotification(
        `⚠️ <b>PARTIAL PAYMENT</b>\n\nOrder: ${orderId}\nExpected: $${price_amount}\nReceived: ${actually_paid} ${pay_currency}\n\nCustomer needs to pay the difference.`
      )

    } else if (payment_status === 'failed' || payment_status === 'expired') {
      // Payment failed or expired
      await sendTelegramNotification(
        `❌ <b>PAYMENT ${payment_status.toUpperCase()}</b>\n\nOrder: ${orderId}\nAmount: $${price_amount}\n\nNo action needed.`
      )
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    // Still return 200 to prevent retries for parsing errors
    return NextResponse.json({ success: true, error: error.message })
  }
}

// Also handle GET for webhook verification (some services ping GET first)
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
