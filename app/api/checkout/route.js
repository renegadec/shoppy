import { NextResponse } from 'next/server'
import { createPayment } from '@/lib/nowpayments'
import { sendTelegramNotification, formatOrderNotification } from '@/lib/telegram'
import products from '@/data/products.json'

export async function POST(request) {
  try {
    const body = await request.json()
    const { productId, email, contactMethod, contactValue } = body

    // Validate product
    const product = products.find(p => p.id === productId)
    if (!product) {
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

    // Generate order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Store order info for webhook (in production, use a database)
    // For now, we'll encode it in the order_id
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
      orderId: `${orderId}|${Buffer.from(JSON.stringify(orderData)).toString('base64')}`,
      orderDescription: `${product.name} - ${product.period}`,
      successUrl: `${baseUrl}/success`,
      cancelUrl: `${baseUrl}/product/${productId}`,
    })

    // Send notification about new order (pending payment)
    await sendTelegramNotification(
      formatOrderNotification({
        orderId,
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
      orderId,
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
