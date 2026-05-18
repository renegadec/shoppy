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
  const endUserId = normalizeEcoCashMsisdn(sourceMobileNumber)
  const path = pathTemplate
    .replace('{endUserId}', encodeURIComponent(endUserId))
    .replace('{clientCorrelator}', encodeURIComponent(sourceReference))
    .replace('{sourceReference}', encodeURIComponent(sourceReference))

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
