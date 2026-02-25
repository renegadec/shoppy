import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createCryptoInvoice } from '@/lib/cryptoGateway'
import { createEcoCashInstantC2BPayment } from '@/lib/ecocash'
import { sendTelegramNotification } from '@/lib/telegram'
import { computeMarkupAmount, hotProductIdForNetwork, generateAirtimeOrderNumber, roundMoney } from '@/lib/airtime'
import { normalizeZwMsisdn } from '@/lib/msisdn'
import { assertPaymentMethodEnabled } from '@/lib/paymentMethods'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      email,
      paymentMethod = 'ecocash',
      customerMsisdn,
      network,
      recipientMsisdn,
      airtimeAmount,
    } = body

    if (!network) return NextResponse.json({ error: 'Network is required' }, { status: 400 })
    if (!recipientMsisdn) return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 })

    const amt = Number(airtimeAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Invalid airtime amount' }, { status: 400 })
    }

    // NOTE: markupRate is admin-configurable (Pricing settings). Fallback to 2%.
    const { getPricingSettingFloat } = await import('@/lib/pricingSettings')
    const markupRate = await getPricingSettingFloat('airtime_markup_rate', 0.02)
    const amountToPay = computeMarkupAmount({ airtimeAmount: amt, markupRate })

    const orderNumber = await generateAirtimeOrderNumber()

    // Email is optional for airtime. We still require a Customer row, so if email is missing
    // we generate a unique placeholder address.
    const normalizedEmail = email ? String(email).trim() : ''
    const customerEmail = normalizedEmail || `guest+${orderNumber}@shoppy.local`

    const contactMethod = normalizedEmail ? 'email' : null
    const contactValue = normalizedEmail || null

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { email: customerEmail } })
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: customerEmail,
          phone: customerMsisdn ? String(customerMsisdn) : null,
        },
      })
    }

    const hotProductId = hotProductIdForNetwork(network)

    const airtimeOrder = await prisma.airtimeOrder.create({
      data: {
        orderNumber,
        airtimeAmount: roundMoney(amt),
        markupRate,
        amount: amountToPay,
        currency: 'USD',
        network: String(network).toLowerCase(),
        recipientMsisdn: String(recipientMsisdn),
        hotProductId: hotProductId ?? undefined,
        customerId: customer.id,
        contactMethod,
        contactValue: contactMethod === 'email' ? customerEmail : contactValue,
        paymentMethod,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const orderData = {
      kind: 'airtime',
      orderNumber,
      email: normalizedEmail || null,
      contactMethod,
      contactValue,
      network: String(network).toLowerCase(),
      recipientMsisdn: String(recipientMsisdn),
      airtimeAmount: roundMoney(amt),
      markupRate,
    }

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
        amount: amountToPay,
        currency: 'USD',
        reason: `${orderNumber} - Airtime ${network} $${roundMoney(amt)} (+2%)`,
        sourceReference,
      })

      await prisma.airtimeOrder.update({
        where: { id: airtimeOrder.id },
        data: {
          paymentMethod: 'ecocash',
          paymentId: sourceReference,
          paymentStatus: 'ecocash_initiated',
          ecocashMsisdn: msisdn,
          deliveryNotes: JSON.stringify({ ecocash: ecoCashResp }),
        },
      })

      paymentUrl = `${baseUrl}/airtime/pending?order=${orderNumber}&method=ecocash`

    } else {
      // NOTE: Do NOT embed large payloads in the crypto gateway order id.
      // We rely on orderNumber + DB lookup in webhook.
      const payment = await createCryptoInvoice({
        priceAmount: amountToPay,
        priceCurrency: 'usd',
        orderId: orderNumber,
        orderDescription: `Airtime ${network} $${roundMoney(amt)} (+2%)`,
        successUrl: `${baseUrl}/airtime/success?order=${orderNumber}`,
        cancelUrl: `${baseUrl}/airtime`,
        // Always send an email to Plisio so it doesn't prompt the customer for one.
        // If the customer didn't provide an email, use our placeholder.
        customerEmail,
      })

      await prisma.airtimeOrder.update({
        where: { id: airtimeOrder.id },
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
      `🟦 <b>NEW AIRTIME ORDER</b>\n\nOrder: ${orderNumber}\nNetwork: ${String(network).toUpperCase()}\nRecipient: ${recipientMsisdn}\nEmail: ${normalizedEmail || 'N/A'}\nAirtime: $${roundMoney(amt)}\nCustomer pays: $${amountToPay}\nPayment: ${paymentMethod}`
    )

    return NextResponse.json({
      success: true,
      orderNumber,
      paymentUrl,
      paymentMethod,
      amountToPay,
    })
  } catch (error) {
    console.error('Airtime checkout error:', {
      message: error?.message,
      status: error?.status,
      details: error?.details,
      stack: error?.stack,
    })
    return NextResponse.json({
      error: error?.message || 'Failed',
      status: error?.status,
      details: error?.details,
    }, { status: 500 })
  }
}
