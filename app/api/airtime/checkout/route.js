import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createCryptoInvoice } from '@/lib/cryptoGateway'
import { createEcoCashInstantC2BPayment } from '@/lib/ecocash'
import { sendTelegramNotification } from '@/lib/telegram'
import { computeMarkupAmount, hotProductIdForNetwork, generateAirtimeOrderNumber, roundMoney } from '@/lib/airtime'
import { normalizeZwMsisdn } from '@/lib/msisdn'

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

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!network) return NextResponse.json({ error: 'Network is required' }, { status: 400 })
    if (!recipientMsisdn) return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 })

    const amt = Number(airtimeAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Invalid airtime amount' }, { status: 400 })
    }

    const markupRate = 0.02
    const amountToPay = computeMarkupAmount({ airtimeAmount: amt, markupRate })

    const contactMethod = 'email'
    const contactValue = email

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { email } })
    if (!customer) {
      customer = await prisma.customer.create({ data: { email } })
    }

    const orderNumber = await generateAirtimeOrderNumber()

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
        contactValue: contactMethod === 'email' ? email : contactValue,
        paymentMethod,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const orderData = {
      kind: 'airtime',
      orderNumber,
      email,
      contactMethod,
      contactValue: contactMethod === 'email' ? email : contactValue,
      network: String(network).toLowerCase(),
      recipientMsisdn: String(recipientMsisdn),
      airtimeAmount: roundMoney(amt),
      markupRate,
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

      paymentUrl = `${baseUrl}/airtime/success?order=${orderNumber}&pending=1&method=ecocash`

    } else {
      // NOTE: Do NOT embed large payloads in NOWPayments order_id.
      // We rely on orderNumber + DB lookup in webhook.
      const payment = await createCryptoInvoice({
        priceAmount: amountToPay,
        priceCurrency: 'usd',
        orderId: orderNumber,
        orderDescription: `Airtime ${network} $${roundMoney(amt)} (+2%)`,
        successUrl: `${baseUrl}/airtime/success?order=${orderNumber}`,
        cancelUrl: `${baseUrl}/airtime`,
        customerEmail: email,
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
      `🟦 <b>NEW AIRTIME ORDER</b>\n\nOrder: ${orderNumber}\nNetwork: ${String(network).toUpperCase()}\nRecipient: ${recipientMsisdn}\nAirtime: $${roundMoney(amt)}\nCustomer pays: $${amountToPay}\nPayment: ${paymentMethod}`
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
