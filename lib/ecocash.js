/**
 * EcoCash Open API Integration (C2B Instant Payment)
 *
 * Base docs portal: https://developers.ecocash.co.zw/
 *
 * This module implements the "instant/c2b" endpoint.
 *
 * Env:
 * - ECOCASH_API_KEY
 * - ECOCASH_BASE_URL (optional) e.g. https://developers.ecocash.co.zw/api/ecocash_pay/api/v2
 * - ECOCASH_C2B_PATH (optional) default: /payment/instant/c2b/sandbox
 */

const DEFAULT_BASE_URL = 'https://developers.ecocash.co.zw/api/ecocash_pay/api/v2'
const DEFAULT_C2B_PATH = '/payment/instant/c2b/sandbox'

export async function createEcoCashInstantC2BPayment({
  customerMsisdn,
  amount,
  currency = 'USD',
  reason = 'Payment',
  sourceReference,
}) {
  const apiKey = process.env.ECOCASH_API_KEY
  if (!apiKey) throw new Error('ECOCASH_API_KEY is not configured')

  const baseUrl = process.env.ECOCASH_BASE_URL || DEFAULT_BASE_URL
  const path = process.env.ECOCASH_C2B_PATH || DEFAULT_C2B_PATH

  if (!customerMsisdn) throw new Error('customerMsisdn is required')
  if (typeof amount !== 'number') throw new Error('amount must be a number')
  if (!sourceReference) throw new Error('sourceReference is required')

  const url = `${baseUrl}${path}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerMsisdn,
      amount,
      reason,
      currency,
      sourceReference,
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // ignore
  }

  if (!response.ok) {
    const msg = data?.message || data?.error || `EcoCash request failed (${response.status})`
    const err = new Error(msg)
    err.status = response.status
    err.details = data
    throw err
  }

  return data
}
