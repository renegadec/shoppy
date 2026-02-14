import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createPayment } from '@/lib/nowpayments'
import { createEcoCashInstantC2BPayment } from '@/lib/ecocash'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'
import { createOrder } from '@/lib/orders'
import prisma from '@/lib/prisma'
import { normalizeZwMsisdn } from '@/lib/msisdn'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      productId,
      email,
      paymentMethod = 'ecocash',
      customerMsisdn,
    } = body

    // Validate product from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || !product.active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Contact is email-only now
    const contactMethod = 'email'
    const contactValue = email

    // Create order in database
    const order = await createOrder({
      email,
      productId: product.id,
      amount: product.price,
      contactMethod,
      contactValue,
    })

    const orderData = {
      productId,
      productName: product.name,
      email,
      contactMethod,
      contactValue,
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    let paymentUrl = null

    if (paymentMethod === 'ecocash') {
      const msisdn = normalizeZwMsisdn(customerMsisdn)
      if (!msisdn) {
        return NextResponse.json({ error: 'EcoCash phone number is required' }, { status: 400 })
      }

      const sourceReference = crypto.randomUUID()

      const ecoCashResp = await createEcoCashInstantC2BPayment({
        customerMsisdn: msisdn,
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
          ecocashMsisdn: msisdn,
        },
      })

      paymentUrl = `${baseUrl}/success?order=${order.orderNumber}&pending=1&method=ecocash`

      orderData.paymentMethod = 'ecocash'
      orderData.ecocash = ecoCashResp

    } else {
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
        data: {
          paymentMethod: 'crypto',
          paymentId: payment.id?.toString(),
          paymentStatus: 'nowpayments_initiated',
        },
      })

      paymentUrl = payment.invoice_url
    }

    await sendTelegramNotification(
      formatOrderNotification({
        orderId: order.orderNumber,
        productName: product.name,
        amount: product.price,
        email,
        contactMethod,
        contactValue,
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
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 })
  }
}
