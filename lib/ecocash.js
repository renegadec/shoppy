/**
 * EcoCash Instant Payment (EIP) API V3 integration.
 *
 * Spec file received: "EcoCash Instant payments APIs V3_April.pdf".
 *
 * The V3 API uses HTTP Basic Auth and the payonline.ecocash.co.zw gateway,
 * not the older developer-portal X-API-KEY instant/c2b endpoint.
 *
 * Required env:
 * - ECOCASH_AUTH_USERNAME
 * - ECOCASH_AUTH_PASSWORD
 * - ECOCASH_MERCHANT_CODE
 * - ECOCASH_MERCHANT_PIN
 * - ECOCASH_MERCHANT_NUMBER
 *
 * Optional env:
 * - ECOCASH_BASE_URL (default: preprod gateway)
 * - ECOCASH_CHARGE_PATH (default: /payment/v1/transactions/amount)
 * - ECOCASH_NOTIFY_URL (default: NEXT_PUBLIC_BASE_URL + /api/ecocash/callback)
 * - ECOCASH_TERMINAL_ID
 * - ECOCASH_LOCATION
 * - ECOCASH_SUPER_MERCHANT_NAME
 * - ECOCASH_MERCHANT_NAME
 */

const DEFAULT_BASE_URL = 'https://payonline.ecocash.co.zw/ecocashGateway-preprod'
const DEFAULT_CHARGE_PATH = '/payment/v1/transactions/amount'

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

function getNotifyUrl() {
  if (process.env.ECOCASH_NOTIFY_URL) return process.env.ECOCASH_NOTIFY_URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) throw new Error('ECOCASH_NOTIFY_URL or NEXT_PUBLIC_BASE_URL is required')
  return `${baseUrl.replace(/\/$/, '')}/api/ecocash/callback`
}

export async function createEcoCashInstantC2BPayment({
  customerMsisdn,
  amount,
  currency = 'USD',
  reason = 'Payment',
  sourceReference,
}) {
  if (!customerMsisdn) throw new Error('customerMsisdn is required')
  if (typeof amount !== 'number') throw new Error('amount must be a number')
  if (!sourceReference) throw new Error('sourceReference is required')

  const username = requiredEnv('ECOCASH_AUTH_USERNAME')
  const password = requiredEnv('ECOCASH_AUTH_PASSWORD')
  const merchantCode = requiredEnv('ECOCASH_MERCHANT_CODE')
  const merchantPin = requiredEnv('ECOCASH_MERCHANT_PIN')
  const merchantNumber = requiredEnv('ECOCASH_MERCHANT_NUMBER')

  const baseUrl = process.env.ECOCASH_BASE_URL || DEFAULT_BASE_URL
  const path = process.env.ECOCASH_CHARGE_PATH || DEFAULT_CHARGE_PATH
  const notifyUrl = getNotifyUrl()
  const endUserId = normalizeEcoCashMsisdn(customerMsisdn)
  const description = String(reason || 'Online Payment').slice(0, 120)

  const body = {
    clientCorrelator: sourceReference,
    notifyUrl,
    referenceCode: sourceReference,
    tranType: 'MER',
    endUserId,
    remarks: description,
    transactionOperationStatus: 'Charged',
    paymentAmount: {
      charginginformation: {
        amount: Number(amount),
        currency,
        description,
      },
      chargeMetaData: {
        channel: 'WEB',
        purchaseCategoryCode: 'Online Payment',
        onBeHalfOf: process.env.ECOCASH_ON_BEHALF_OF || process.env.ECOCASH_MERCHANT_NAME || 'Shoppy',
      },
    },
    merchantCode,
    merchantPin,
    merchantNumber,
    currencyCode: currency,
    countryCode: process.env.ECOCASH_COUNTRY_CODE || 'ZW',
    terminalID: process.env.ECOCASH_TERMINAL_ID || 'WEB',
    location: process.env.ECOCASH_LOCATION || 'Online',
    superMerchantName: process.env.ECOCASH_SUPER_MERCHANT_NAME || process.env.ECOCASH_MERCHANT_NAME || 'Shoppy',
    merchantName: process.env.ECOCASH_MERCHANT_NAME || 'Shoppy',
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(username, password),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const msg = data?.message || data?.error || data?.fault?.message || `EcoCash request failed (${response.status})`
    const err = new Error(msg)
    err.status = response.status
    err.details = data
    throw err
  }

  return data
}
