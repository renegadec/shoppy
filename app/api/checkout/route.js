import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createCryptoInvoice } from '@/lib/cryptoGateway'
import { createEcoCashInstantC2BPayment } from '@/lib/ecocash'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'
import { createOrder } from '@/lib/orders'
import prisma from '@/lib/prisma'
import { normalizeZwMsisdn } from '@/lib/msisdn'
import { assertPaymentMethodEnabled } from '@/lib/paymentMethods'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      productId,
      email,
      paymentMethod = 'ecocash',
      customerMsisdn,
      contactMethod,
      contactValue,
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

    // Contact preference (digital products only)
    const preferredContactMethod = contactMethod || 'email'
    const preferredContactValue = preferredContactMethod === 'email'
      ? email
      : (contactValue || '')

    if (!preferredContactValue) {
      return NextResponse.json({
        error: preferredContactMethod === 'telegram'
          ? 'Telegram username is required'
          : preferredContactMethod === 'whatsapp'
            ? 'WhatsApp number is required'
            : 'Contact value is required',
      }, { status: 400 })
    }

    // Create order in database
    const order = await createOrder({
      email,
      productId: product.id,
      amount: product.price,
      contactMethod: preferredContactMethod,
      contactValue: preferredContactValue,
    })

    const orderData = {
      productId,
      productName: product.name,
      email,
      contactMethod: preferredContactMethod,
      contactValue: preferredContactValue,
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Enforce enabled payment methods (server-side)
    const gate = await assertPaymentMethodEnabled(paymentMethod)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.note || 'Payment method unavailable' }, { status: 400 })
    }

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
      const payment = await createCryptoInvoice({
        priceAmount: product.price,
        priceCurrency: 'usd',
        orderId: `${order.orderNumber}|${Buffer.from(JSON.stringify(orderData)).toString('base64')}`,
        orderDescription: `${product.name}${product.period ? ` - ${product.period}` : ''}`,
        successUrl: `${baseUrl}/success?order=${order.orderNumber}`,
        cancelUrl: `${baseUrl}/product/${productId}`,
        customerEmail: email,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'crypto',
          paymentId: payment.id?.toString?.() || payment.id || null,
          providerRef: payment.verify_hash || null,
          paymentStatus: `${payment.provider}_initiated`,
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
        contactMethod: preferredContactMethod,
        contactValue: preferredContactValue,
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
