import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createCryptoInvoice } from '@/lib/cryptoGateway'
import { createEcoCashInstantC2BPayment, generateEcoCashRef } from '@/lib/ecocash'
import { createOmariPaymentAuth } from '@/lib/omari'
import { sendTelegramNotification } from '@/lib/telegram'
import { computeMarkupAmount, generateTeloneOrderNumber, roundMoney } from '@/lib/telone'
import { normalizeZwMsisdn } from '@/lib/msisdn'
import { assertPaymentMethodEnabled } from '@/lib/paymentMethods'
import { getPricingSettingFloat } from '@/lib/pricingSettings'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      email,
      paymentMethod = 'ecocash',
      customerMsisdn,
      target,
      notifyNumber,
      bundleProductCode,
      bundleName,
      amount,
      currency = 'USD',
    } = body

    if (!target) return NextResponse.json({ error: 'Telone account number is required' }, { status: 400 })
    if (!notifyNumber) return NextResponse.json({ error: 'Notify number is required' }, { status: 400 })
    if (!bundleProductCode) return NextResponse.json({ error: 'Bundle product code is required' }, { status: 400 })

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const markupRate = await getPricingSettingFloat('telone_markup_rate', 0.01)
    const amountToPay = computeMarkupAmount({ amount: amt, markupRate })

    const orderNumber = await generateTeloneOrderNumber()

    const normalizedEmail = email ? String(email).trim() : ''
    const customerEmail = normalizedEmail || `guest+${orderNumber}@shoppy.local`

    let customer = await prisma.customer.findUnique({ where: { email: customerEmail } })
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: customerEmail,
          phone: customerMsisdn ? String(customerMsisdn) : null,
        },
      })
    }

    const contactMethod = normalizedEmail ? 'email' : null
    const contactValue = normalizedEmail || null

    const order = await prisma.teloneOrder.create({
      data: {
        orderNumber,
        bundleProductCode: Number(bundleProductCode),
        bundleName: String(bundleName || ''),
        amount: roundMoney(amountToPay),
        currency,
        markupRate,
        target: String(target),
        notifyNumber: String(notifyNumber),
        hotProductId: 31,
        customerId: customer.id,
        contactMethod,
        contactValue,
        paymentMethod,
      },
    })

    const origin = request.headers.get('origin') || request.headers.get('x-forwarded-host') || ''
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

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

      const sourceReference = generateEcoCashRef()

      const ecoCashResp = await createEcoCashInstantC2BPayment({
        customerMsisdn: msisdn,
        amount: amountToPay,
        currency,
        reason: `Shoppy - Telone Broadband`,
        sourceReference,
      })

      await prisma.teloneOrder.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'ecocash',
          paymentId: sourceReference,
          paymentStatus: 'ecocash_initiated',
          ecocashMsisdn: msisdn,
          deliveryNotes: JSON.stringify({ ecocash: ecoCashResp }),
        },
      })

      paymentUrl = `${baseUrl}/telone/pending?order=${orderNumber}&method=ecocash`

    } else if (paymentMethod === 'omari') {
      const msisdn = normalizeZwMsisdn(customerMsisdn)
      if (!msisdn) {
        return NextResponse.json({ error: 'Omari phone number is required' }, { status: 400 })
      }

      const reference = crypto.randomUUID()
      const auth = await createOmariPaymentAuth({
        msisdn,
        reference,
        amount: amountToPay,
        currency,
        channel: 'WEB',
      })

      await prisma.teloneOrder.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'omari',
          paymentId: reference,
          paymentStatus: 'omari_auth_initiated',
          ecocashMsisdn: msisdn,
          deliveryNotes: JSON.stringify({ omariAuth: auth }),
        },
      })

      paymentUrl = `${baseUrl}/telone/pending?order=${orderNumber}&method=omari`

    } else {
      let cryptoAmount = amountToPay
      let cryptoCurrency = 'usd'
      if (currency === 'ZWG') {
        const rate = await getPricingSettingFloat('usd_zig_rate', 25)
        cryptoAmount = rate > 0 ? roundMoney(amountToPay / rate) : amountToPay
        cryptoCurrency = 'usd'
      }

      const payment = await createCryptoInvoice({
        priceAmount: cryptoAmount,
        priceCurrency: cryptoCurrency,
        orderId: orderNumber,
        orderDescription: `Telone Broadband $${roundMoney(amt)} (+${Math.round(markupRate * 100)}%)`,
        successUrl: `${baseUrl}/telone/success?order=${orderNumber}`,
        cancelUrl: `${baseUrl}/telone`,
        customerEmail,
      })

      await prisma.teloneOrder.update({
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
      `📡 <b>NEW TELONE BROADBAND ORDER</b>\n\nOrder: ${orderNumber}\nTarget: ${target}\nBundle: ${bundleName || bundleProductCode}\nNotify: ${notifyNumber}\nAmount: $${roundMoney(amountToPay)}\nPayment: ${paymentMethod}`
    )

    return NextResponse.json({ success: true, orderNumber, paymentUrl, paymentMethod, amountToPay })
  } catch (e) {
    console.error('Telone checkout error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
