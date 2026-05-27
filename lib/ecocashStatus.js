/**
 * EcoCash Instant Payment (EIP) API V3 transaction lookup.
 *
 * Spec endpoint:
 * GET /payment/v1/{endUserId}/transactions/amount/{clientCorrelator}
 */

const DEFAULT_BASE_URL = 'https://payonline.ecocash.co.zw/ecocashGateway-preprod'
const DEFAULT_STATUS_PATH_TEMPLATE = '/payment/v1/{endUserId}/transactions/amount/{clientCorrelator}'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function basicAuthHeader(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

function normalizeEcoCashMsisdn(msisdn) {
  const digits = String(msisdn || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('263')) return digits
  if (digits.startsWith('0')) return `263${digits.slice(1)}`
  return digits
}

function uniqueTruthy(values) {
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))]
}

function buildStatusPath({ pathTemplate, endUserId, sourceReference }) {
  return pathTemplate
    .replace('{endUserId}', encodeURIComponent(endUserId))
    .replace('{clientCorrelator}', encodeURIComponent(sourceReference))
    .replace('{sourceReference}', encodeURIComponent(sourceReference))
}

async function fetchEcoCashStatus({ baseUrl, path, username, password }) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      Authorization: basicAuthHeader(username, password),
      Accept: 'application/json',
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const msg = data?.message || data?.error || data?.fault?.message || `EcoCash status lookup failed (${response.status})`
    const err = new Error(msg)
    err.status = response.status
    err.details = data
    throw err
  }

  return data
}

export async function getEcoCashC2BTransactionStatus({
  sourceMobileNumber,
  sourceReference,
}) {
  if (!sourceMobileNumber) throw new Error('sourceMobileNumber is required')
  if (!sourceReference) throw new Error('sourceReference is required')

  const username = requiredEnv('ECOCASH_AUTH_USERNAME')
  const password = requiredEnv('ECOCASH_AUTH_PASSWORD')
  const baseUrl = process.env.ECOCASH_BASE_URL || process.env.ECOCASH_STATUS_BASE_URL || DEFAULT_BASE_URL
  const pathTemplate = process.env.ECOCASH_STATUS_PATH_TEMPLATE || process.env.ECOCASH_STATUS_PATH || DEFAULT_STATUS_PATH_TEMPLATE

  // EcoCash's V3 query sample uses merchantCode as the path endUserId, while
  // older wording can read like the customer MSISDN. Try the configured/merchant
  // identifier first, then fall back to the customer number so preprod variants
  // don't strand a paid order on the pending page.
  const endUserIdCandidates = uniqueTruthy([
    process.env.ECOCASH_STATUS_END_USER_ID,
    process.env.ECOCASH_MERCHANT_CODE,
    normalizeEcoCashMsisdn(sourceMobileNumber),
  ])

  let lastError = null
  for (const endUserId of endUserIdCandidates) {
    const path = buildStatusPath({ pathTemplate, endUserId, sourceReference })
    try {
      return await fetchEcoCashStatus({ baseUrl, path, username, password })
    } catch (err) {
      lastError = err
      if (![404, 400].includes(Number(err.status))) throw err
    }
  }

  throw lastError || new Error('EcoCash status lookup failed')
}

export function getEcoCashOperationStatus(status) {
  return String(
    status?.transactionOperationStatus ||
      status?.status ||
      status?.paymentStatus ||
      status?.transactionStatus ||
      ''
  ).toUpperCase()
}

export function isEcoCashPaidStatus(status) {
  const operationStatus = getEcoCashOperationStatus(status)
  return ['COMPLETED', 'SUCCESS', 'SUCCESSFUL', 'PAID', 'CONFIRMED'].includes(operationStatus)
}

export function getEcoCashPaymentStatusSlug(status) {
  const operationStatus = getEcoCashOperationStatus(status)
  return String(operationStatus || 'unknown').toLowerCase().replace(/\s+/g, '_')
}

export function getEcoCashPaidAmount(status, fallbackAmount) {
  return (
    status?.paymentAmount?.totalAmountCharged ??
    status?.paymentAmount?.charginginformation?.amount ??
    status?.amount?.amount ??
    fallbackAmount
  )
}

export function getEcoCashPaidCurrency(status, fallbackCurrency = 'USD') {
  return (
    status?.paymentAmount?.charginginformation?.currency ??
    status?.amount?.currency ??
    status?.currencyCode ??
    fallbackCurrency
  )
}

export function getEcoCashProviderRef(status, fallbackRef = null) {
  return status?.ecocashReference ?? status?.serverReferenceCode ?? fallbackRef
}
