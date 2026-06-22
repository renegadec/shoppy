/**
 * Crypto gateway abstraction.
 *
 * NOTE: This project previously supported multiple providers.
 * We now use Plisio only.
 */

import { createInvoice as createPlisioInvoice } from '@/lib/plisio'

export function getCryptoProvider() {
  return 'plisio'
}

export function getCryptoWebhookPath() {
  // Primary path for Plisio callbacks.
  // (We also keep /api/webhook as a legacy alias to this handler.)
  return '/api/webhook/plisio'
}

export async function createCryptoInvoice({
  priceAmount,
  priceCurrency = 'usd',
  orderId,
  orderDescription,
  customerEmail,
  successUrl,
  cancelUrl,
}) {
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
    successUrl,
    cancelUrl,
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
