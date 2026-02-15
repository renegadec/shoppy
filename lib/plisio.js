/**
 * Plisio API Integration
 * Base: https://api.plisio.net/api/v1
 * Uses GET requests with query params (including api_key).
 */

const API_BASE = 'https://api.plisio.net/api/v1'

function requireApiKey() {
  const apiKey = process.env.PLISIO_API_KEY
  if (!apiKey) throw new Error('PLISIO_API_KEY is not configured')
  return apiKey
}

function buildUrl(path, params) {
  const url = new URL(`${API_BASE}/${path}`)
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    url.searchParams.set(k, String(v))
  })
  return url.toString()
}

export async function createInvoice({
  orderNumber,
  orderName,
  description,
  sourceAmount,
  sourceCurrency = 'USD',
  // Plisio requires a "currency" field (crypto), even when using sourceCurrency/sourceAmount.
  // We'll default to BTC unless you override.
  currency = 'BTC',
  allowedPsyscids,
  callbackUrl,
  email,
  expireMin,
}) {
  const apiKey = requireApiKey()

  const url = buildUrl('invoices/new', {
    api_key: apiKey,
    currency,
    order_number: orderNumber,
    order_name: orderName,
    description,
    source_amount: sourceAmount,
    source_currency: sourceCurrency,
    allowed_psyscids: allowedPsyscids,
    callback_url: callbackUrl,
    email,
    expire_min: expireMin,
  })

  const response = await fetch(url, { method: 'GET' })
  const rawText = await response.text()

  let parsed = null
  try {
    parsed = rawText ? JSON.parse(rawText) : null
  } catch {
    // ignore
  }

  if (!response.ok) {
    const baseMsg = parsed?.message || parsed?.error || rawText || 'Unknown error'
    const msg = `Plisio create invoice error (${response.status}): ${baseMsg}`
    const err = new Error(msg)
    err.status = response.status
    err.details = parsed || { raw: rawText }
    throw err
  }

  // Plisio response shape differs across docs/SDK versions.
  // Common: { status: 'success', data|response: { txn_id, invoice_url, verify_hash, ... } }
  const data = parsed?.data || parsed?.response || parsed
  return { raw: parsed, data }
}

export async function getOperation(operationId) {
  const apiKey = requireApiKey()
  const url = buildUrl(`operations/${encodeURIComponent(operationId)}`, { api_key: apiKey })

  const response = await fetch(url, { method: 'GET' })
  if (!response.ok) {
    const rawText = await response.text().catch(() => '')
    throw new Error(`Plisio get operation failed (${response.status}): ${rawText || 'Unknown error'}`)
  }
  return response.json()
}
