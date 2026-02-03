/**
 * NOWPayments API Integration
 * Docs: https://documenter.getpostman.com/view/7907941/S1a32n38
 */

const API_BASE = 'https://api.nowpayments.io/v1'

export async function createPayment({ 
  priceAmount, 
  priceCurrency = 'usd',
  orderId,
  orderDescription,
  successUrl,
  cancelUrl,
}) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY

  if (!apiKey) {
    throw new Error('NOWPAYMENTS_API_KEY is not configured')
  }

  const response = await fetch(`${API_BASE}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: priceAmount,
      price_currency: priceCurrency,
      order_id: orderId,
      order_description: orderDescription,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // ipn_callback_url is set in NOWPayments dashboard
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create payment')
  }

  return response.json()
}

export async function getPaymentStatus(paymentId) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY

  const response = await fetch(`${API_BASE}/payment/${paymentId}`, {
    headers: {
      'x-api-key': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get payment status')
  }

  return response.json()
}

export function verifyWebhookSignature(payload, signature) {
  // NOWPayments sends an IPN secret that you can verify
  // For now, we'll do basic validation
  // In production, verify the signature using your IPN secret
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET
  
  if (!ipnSecret) {
    console.warn('NOWPAYMENTS_IPN_SECRET not set - skipping signature verification')
    return true
  }

  // NOWPayments uses HMAC-SHA512 for signature
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha512', ipnSecret)
  
  // Sort the payload keys and create the string to sign
  const sortedPayload = Object.keys(payload)
    .sort()
    .reduce((acc, key) => {
      acc[key] = payload[key]
      return acc
    }, {})
  
  hmac.update(JSON.stringify(sortedPayload))
  const calculatedSignature = hmac.digest('hex')
  
  return calculatedSignature === signature
}
