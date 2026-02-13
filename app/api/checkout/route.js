import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createPayment } from '@/lib/nowpayments'
import { createEcoCashInstantC2BPayment } from '@/lib/ecocash'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'
import { createOrder } from '@/lib/orders'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      productId,
      email,
      contactMethod,
      contactValue,
      paymentMethod = 'crypto',
      customerMsisdn,
    } = body

    // Validate product from database
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!product || !product.active) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate contact info
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (contactMethod !== 'email' && !contactValue) {
      return NextResponse.json(
        { error: 'Contact information is required' },
        { status: 400 }
      )
    }

    // Create order in database
    const order = await createOrder({
      email,
      productId: product.id,
      amount: product.price,
      contactMethod,
      contactValue: contactMethod === 'email' ? email : contactValue,
    })

    // Store order info for webhook (encoded in order_id for NOWPayments)
    const orderData = {
      productId,
      productName: product.name,
      email,
      contactMethod,
      contactValue: contactMethod === 'email' ? email : contactValue,
    }

    // Get the base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    let paymentUrl = null

    if (paymentMethod === 'ecocash') {
      if (!customerMsisdn) {
        return NextResponse.json(
          { error: 'EcoCash phone number is required' },
          { status: 400 }
        )
      }

      // EcoCash requires a UUID sourceReference. We'll generate one and store it.
      const sourceReference = crypto.randomUUID()

      // EcoCash: triggers a payment prompt on the user's phone (no redirect URL)
      const ecoCashResp = await createEcoCashInstantC2BPayment({
        customerMsisdn,
        amount: product.price,
        currency: 'USD',
        reason: `${order.orderNumber} - ${product.name}${product.period ? ` - ${product.period}` : ''}`,
        sourceReference,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'ecocash',
          paymentId: sourceReference,
          paymentStatus: `ecocash_initiated`,
          ecocashMsisdn: customerMsisdn,
        },
      })

      // Frontend should redirect to a pending/success screen
      paymentUrl = `${baseUrl}/success?order=${order.orderNumber}&pending=1&method=ecocash`

      // Attach to orderData for notifications/debug
      orderData.paymentMethod = 'ecocash'
      orderData.ecocash = ecoCashResp

    } else {
      // Default: NOWPayments invoice
      const payment = await createPayment({
        priceAmount: product.price,
        priceCurrency: 'usd',
        orderId: `${order.orderNumber}|${Buffer.from(JSON.stringify(orderData)).toString('base64')}`,
        orderDescription: `${product.name}${product.period ? ` - ${product.period}` : ''}`,
        successUrl: `${baseUrl}/success?order=${order.orderNumber}`,
        cancelUrl: `${baseUrl}/product/${productId}`,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: 'crypto', paymentId: payment.id?.toString(), paymentStatus: 'nowpayments_initiated' }
      })

      paymentUrl = payment.invoice_url
    }

    // Send notification about new order (pending payment)
    await sendTelegramNotification(
      formatOrderNotification({
        orderId: order.orderNumber,
        productName: product.name,
        amount: product.price,
        email,
        contactMethod,
        contactValue: contactMethod === 'email' ? email : contactValue,
        paymentStatus: 'pending',
      })
    )

    return NextResponse.json({
      success: true,
      orderId: order.orderNumber,
      paymentUrl,
      paymentMethod,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
