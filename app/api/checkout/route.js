import { NextResponse } from 'next/server'
import { createPayment } from '@/lib/nowpayments'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'
import { createOrder } from '@/lib/orders'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { productId, email, contactMethod, contactValue } = body

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

    // Create NOWPayments invoice
    const payment = await createPayment({
      priceAmount: product.price,
      priceCurrency: 'usd',
      orderId: `${order.orderNumber}|${Buffer.from(JSON.stringify(orderData)).toString('base64')}`,
      orderDescription: `${product.name}${product.period ? ` - ${product.period}` : ''}`,
      successUrl: `${baseUrl}/success?order=${order.orderNumber}`,
      cancelUrl: `${baseUrl}/product/${productId}`,
    })

    // Update order with payment ID
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: payment.id?.toString() }
    })

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
      paymentUrl: payment.invoice_url,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
