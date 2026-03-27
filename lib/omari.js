const DEFAULT_BASE_URL = 'https://omari.v.co.zw/uat/vsuite/omari/api/merchant/api/payment'

function getBaseUrl() {
  return (process.env.OMARI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
}

function maskSecret(value) {
  if (!value) return '(missing)'
  const trimmed = String(value).trim()
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`
}

function getHeaders() {
  const apiKey = process.env.OMARI_MERCHANT_KEY
  if (!apiKey) throw new Error('OMARI_MERCHANT_KEY is not configured')

  return {
    'X-Merchant-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

function logOmariRequestContext(operation, extra = {}) {
  const rawKey = process.env.OMARI_MERCHANT_KEY
  const trimmedKey = rawKey ? String(rawKey).trim() : ''

  console.log('[omari] request context', {
    operation,
    baseUrl: getBaseUrl(),
    hasMerchantKey: Boolean(rawKey),
    merchantKeyPreview: maskSecret(trimmedKey),
    merchantKeyLength: trimmedKey.length,
    merchantKeyTrimmed: rawKey === trimmedKey,
    ...extra,
  })
}

async function parseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function assertOmariOk(data, fallbackMessage) {
  const code = String(data?.responseCode || '')
  if (data?.error || (code && code !== '000')) {
    const err = new Error(data?.message || fallbackMessage)
    err.details = data
    throw err
  }
}

export async function createOmariPaymentAuth({ msisdn, reference, amount, currency = 'USD', channel = 'WEB' }) {
  if (!msisdn) throw new Error('msisdn is required')
  if (!reference) throw new Error('reference is required')
  if (typeof amount !== 'number' || !Number.isFinite(amount)) throw new Error('amount must be a number')

  const baseUrl = getBaseUrl()
  const payload = { msisdn, reference, amount, currency, channel }
  logOmariRequestContext('auth', {
    url: `${baseUrl}/auth`,
    msisdn,
    reference,
    amount,
    currency,
    channel,
  })

  const response = await fetch(`${baseUrl}/auth`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await parseJson(response)
  console.log('[omari] auth response', {
    status: response.status,
    ok: response.ok,
    responseCode: data?.responseCode,
    message: data?.message,
  })

  if (!response.ok) {
    const err = new Error(data?.message || `Omari auth failed (${response.status})`)
    err.status = response.status
    err.details = data
    throw err
  }

  assertOmariOk(data, 'Omari auth failed')
  return data
}

export async function submitOmariPaymentOtp({ msisdn, reference, otp }) {
  if (!msisdn) throw new Error('msisdn is required')
  if (!reference) throw new Error('reference is required')
  if (!otp) throw new Error('otp is required')

  const baseUrl = getBaseUrl()
  logOmariRequestContext('request', {
    url: `${baseUrl}/request`,
    msisdn,
    reference,
    otpLength: String(otp).length,
  })

  const response = await fetch(`${baseUrl}/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ msisdn, reference, otp }),
  })

  const data = await parseJson(response)
  console.log('[omari] request response', {
    status: response.status,
    ok: response.ok,
    responseCode: data?.responseCode,
    message: data?.message,
  })

  if (!response.ok) {
    const err = new Error(data?.message || `Omari request failed (${response.status})`)
    err.status = response.status
    err.details = data
    throw err
  }

  assertOmariOk(data, 'Omari payment request failed')
  return data
}

export async function getOmariPaymentStatus(reference) {
  if (!reference) throw new Error('reference is required')

  const baseUrl = getBaseUrl()
  logOmariRequestContext('query', {
    url: `${baseUrl}/query/${encodeURIComponent(reference)}`,
    reference,
  })

  const response = await fetch(`${baseUrl}/query/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  const data = await parseJson(response)
  console.log('[omari] query response', {
    status: response.status,
    ok: response.ok,
    responseCode: data?.responseCode,
    message: data?.message,
  })

  if (!response.ok) {
    const err = new Error(data?.message || `Omari query failed (${response.status})`)
    err.status = response.status
    err.details = data
    throw err
  }

  assertOmariOk(data, 'Omari query failed')
  return data
}
