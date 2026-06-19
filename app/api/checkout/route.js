import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createCryptoInvoice } from '@/lib/cryptoGateway'
import { createEcoCashInstantC2BPayment, generateEcoCashRef } from '@/lib/ecocash'
import { createOmariPaymentAuth } from '@/lib/omari'
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
      currency = 'USD',
    } = body

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product || !product.active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const preferredContactMethod = contactMethod || 'email'
    const preferredContactValue = preferredContactMethod === 'email' ? email : (contactValue || '')

    if (!preferredContactValue) {
      return NextResponse.json({
        error: preferredContactMethod === 'telegram'
          ? 'Telegram username is required'
          : preferredContactMethod === 'whatsapp'
            ? 'WhatsApp number is required'
            : 'Contact value is required',
      }, { status: 400 })
    }

    const order = await createOrder({
      email,
      productId: product.id,
      amount: product.price,
      currency,
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

    // Use the request origin for the redirect URL (so localhost tests stay local),
    // while the EcoCash notifyUrl still uses NEXT_PUBLIC_BASE_URL for public reachability.
    const origin = request.headers.get('origin') || request.headers.get('x-forwarded-host') || ''
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const gate = await assertPaymentMethodEnabled(paymentMethod)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.note || 'Payment method unavailable' }, { status: 400 })
    }

    console.log('[checkout] payment selection', {
      productId,
      orderNumber: order.orderNumber,
      paymentMethod,
      customerMsisdn: customerMsisdn ? normalizeZwMsisdn(customerMsisdn) : null,
      baseUrl,
    })

    let paymentUrl = null

    if (paymentMethod === 'ecocash') {
      const msisdn = normalizeZwMsisdn(customerMsisdn)
      if (!msisdn) {
        return NextResponse.json({ error: 'EcoCash phone number is required' }, { status: 400 })
      }

      const sourceReference = generateEcoCashRef()
      const ecoCashResp = await createEcoCashInstantC2BPayment({
        customerMsisdn: msisdn,
        amount: product.price,
        currency,
        reason: `Shoppy - ${product.name}`,
        sourceReference,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'ecocash',
          paymentId: sourceReference,
          paymentStatus: 'ecocash_initiated',
          ecocashMsisdn: msisdn,
          deliveryNotes: JSON.stringify({ ecocash: ecoCashResp }),
        },
      })

      paymentUrl = `${baseUrl}/pending?order=${order.orderNumber}&method=ecocash`
      orderData.paymentMethod = 'ecocash'
      orderData.ecocash = ecoCashResp
      console.log('[checkout] ecocash branch selected', { orderNumber: order.orderNumber, paymentUrl })
    } else if (paymentMethod === 'omari') {
      const msisdn = normalizeZwMsisdn(customerMsisdn)
      if (!msisdn) {
        return NextResponse.json({ error: 'Omari phone number is required' }, { status: 400 })
      }

      const reference = crypto.randomUUID()
      const auth = await createOmariPaymentAuth({
        msisdn,
        reference,
        amount: product.price,
        currency,
        channel: 'WEB',
      })

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'omari',
          paymentId: reference,
          paymentStatus: 'omari_auth_initiated',
          ecocashMsisdn: msisdn,
          deliveryNotes: JSON.stringify({ omariAuth: auth }),
        },
      })

      paymentUrl = `${baseUrl}/pending?order=${order.orderNumber}&method=omari`
      orderData.paymentMethod = 'omari'
      orderData.omariAuth = auth
      console.log('[checkout] omari branch selected', { orderNumber: order.orderNumber, paymentUrl, responseCode: auth?.responseCode, message: auth?.message })
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
      console.log('[checkout] crypto/plisio branch selected', { orderNumber: order.orderNumber, paymentUrl, provider: payment?.provider })
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
