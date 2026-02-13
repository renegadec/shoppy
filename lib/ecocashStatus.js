/**
 * EcoCash transaction status lookup
 *
 * Endpoint (sandbox): /api/v1/transaction/c2b/status/sandbox
 */

const DEFAULT_BASE_URL = 'https://developers.ecocash.co.zw/api/ecocash_pay'
const DEFAULT_STATUS_PATH = '/api/v1/transaction/c2b/status/sandbox'

export async function getEcoCashC2BTransactionStatus({
  sourceMobileNumber,
  sourceReference,
}) {
  const apiKey = process.env.ECOCASH_API_KEY
  if (!apiKey) throw new Error('ECOCASH_API_KEY is not configured')

  const baseUrl = process.env.ECOCASH_STATUS_BASE_URL || DEFAULT_BASE_URL
  const path = process.env.ECOCASH_STATUS_PATH || DEFAULT_STATUS_PATH

  if (!sourceMobileNumber) throw new Error('sourceMobileNumber is required')
  if (!sourceReference) throw new Error('sourceReference is required')

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourceMobileNumber, sourceReference }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const msg = data?.message || data?.error || `EcoCash status lookup failed (${response.status})`
    const err = new Error(msg)
    err.status = response.status
    err.details = data
    throw err
  }

  return data
}
