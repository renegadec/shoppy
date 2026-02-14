import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createPayment } from '@/lib/nowpayments'
import { createEcoCashInstantC2BPayment } from '@/lib/ecocash'
import { sendTelegramNotification } from '@/lib/telegram'
import { computeMarkupAmount, generateZesaOrderNumber, roundMoney } from '@/lib/zesa'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      email,
      paymentMethod = 'ecocash',
      customerMsisdn,
      meterNumber,
      notifyNumber,
      tokenAmount,
    } = body

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!meterNumber) return NextResponse.json({ error: 'Meter number is required' }, { status: 400 })
    if (!notifyNumber) return NextResponse.json({ error: 'Notify number is required' }, { status: 400 })

    const amt = Number(tokenAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const markupRate = 0.01
    const amountToPay = computeMarkupAmount({ tokenAmount: amt, markupRate })

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { email } })
    if (!customer) customer = await prisma.customer.create({ data: { email } })

    const orderNumber = await generateZesaOrderNumber()

    const contactMethod = 'email'
    const contactValue = email

    const order = await prisma.zesaOrder.create({
      data: {
        orderNumber,
        tokenAmount: roundMoney(amt),
        markupRate,
        amount: amountToPay,
        currency: 'USD',
        meterNumber: String(meterNumber),
        notifyNumber: String(notifyNumber),
        hotProductId: 41,
        customerId: customer.id,
        contactMethod,
        contactValue,
        paymentMethod,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const orderData = {
      kind: 'zesa',
      orderNumber,
      email,
      meterNumber: String(meterNumber),
      notifyNumber: String(notifyNumber),
      tokenAmount: roundMoney(amt),
      markupRate,
    }

    let paymentUrl = null

    if (paymentMethod === 'ecocash') {
      if (!customerMsisdn) {
        return NextResponse.json({ error: 'EcoCash phone number is required' }, { status: 400 })
      }

      const sourceReference = crypto.randomUUID()

      const ecoCashResp = await createEcoCashInstantC2BPayment({
        customerMsisdn,
        amount: amountToPay,
        currency: 'USD',
        reason: `${orderNumber} - ZESA $${roundMoney(amt)} (+1%)`,
        sourceReference,
      })

      await prisma.zesaOrder.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'ecocash',
          paymentId: sourceReference,
          paymentStatus: 'ecocash_initiated',
          ecocashMsisdn: customerMsisdn,
          deliveryNotes: JSON.stringify({ ecocash: ecoCashResp }),
        },
      })

      paymentUrl = `${baseUrl}/zesa/success?order=${orderNumber}&pending=1&method=ecocash`

    } else {
      const payment = await createPayment({
        priceAmount: amountToPay,
        priceCurrency: 'usd',
        orderId: `${orderNumber}|${Buffer.from(JSON.stringify(orderData)).toString('base64')}`,
        orderDescription: `ZESA $${roundMoney(amt)} (+1%)`,
        successUrl: `${baseUrl}/zesa/success?order=${orderNumber}`,
        cancelUrl: `${baseUrl}/zesa`,
      })

      await prisma.zesaOrder.update({
        where: { id: order.id },
        data: { paymentMethod: 'crypto', paymentId: payment.id?.toString(), paymentStatus: 'nowpayments_initiated' },
      })

      paymentUrl = payment.invoice_url
    }

    await sendTelegramNotification(
      `🟨 <b>NEW ZESA ORDER</b>\n\nOrder: ${orderNumber}\nMeter: ${meterNumber}\nNotify: ${notifyNumber}\nToken: $${roundMoney(amt)}\nCustomer pays: $${amountToPay}\nPayment: ${paymentMethod}`
    )

    return NextResponse.json({ success: true, orderNumber, paymentUrl, paymentMethod, amountToPay })
  } catch (e) {
    console.error('ZESA checkout error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
