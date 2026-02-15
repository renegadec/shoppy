/**
 * Crypto gateway abstraction.
 *
 * Goal: allow swapping providers (NOWPayments ↔ Plisio) without rewriting checkout flows.
 */

import { createPayment as createNowPaymentsInvoice } from '@/lib/nowpayments'
import { createInvoice as createPlisioInvoice } from '@/lib/plisio'

export function getCryptoProvider() {
  return (process.env.CRYPTO_PROVIDER || 'nowpayments').toLowerCase()
}

export function getCryptoWebhookPath() {
  const provider = getCryptoProvider()
  if (provider === 'plisio') return '/api/webhook/plisio'
  return '/api/webhook'
}

export async function createCryptoInvoice({
  priceAmount,
  priceCurrency = 'usd',
  orderId,
  orderDescription,
  successUrl,
  cancelUrl,
  customerEmail,
}) {
  const provider = getCryptoProvider()

  if (provider === 'plisio') {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}${getCryptoWebhookPath()}`

    const allowedPsyscids = process.env.PLISIO_ALLOWED_PSYS || undefined
    const defaultCurrency = process.env.PLISIO_DEFAULT_CURRENCY || 'BTC'

    const invoice = await createPlisioInvoice({
      orderNumber: orderId,
      orderName: orderId,
      description: orderDescription,
      sourceAmount: priceAmount,
      sourceCurrency: String(priceCurrency || 'usd').toUpperCase(),
      currency: defaultCurrency,
      allowedPsyscids,
      callbackUrl,
      email: customerEmail,
      expireMin: process.env.PLISIO_EXPIRE_MIN || undefined,
    })

    const d = invoice?.data || {}
    return {
      provider: 'plisio',
      id: d.txn_id || d.txnId || d.id || null,
      invoice_url: d.invoice_url || d.invoiceUrl || null,
      verify_hash: d.verify_hash || d.verifyHash || null,
      raw: invoice.raw,
    }
  }

  const invoice = await createNowPaymentsInvoice({
    priceAmount,
    priceCurrency,
    orderId,
    orderDescription,
    successUrl,
    cancelUrl,
  })

  return {
    provider: 'nowpayments',
    id: invoice?.id?.toString?.() || invoice?.id || null,
    invoice_url: invoice?.invoice_url || null,
    raw: invoice,
  }
}
