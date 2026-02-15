/**
 * Hot Recharge API (Hot API v3)
 * Docs: https://hot-api-v3.readme.io/
 *
 * Auth:
 * - POST https://ssl.hot.co.zw/api/v3/identity/login  { AccessCode, Password }
 * - POST https://ssl.hot.co.zw/api/v3/identity/refresh { token, refreshToken }
 *
 * Recharge:
 * - POST https://ssl.hot.co.zw/api/v3/products/recharge
 *
 * Env:
 * - HOT_ACCESS_CODE
 * - HOT_PASSWORD
 * - HOT_BASE_URL (optional) default https://ssl.hot.co.zw
 */

const DEFAULT_BASE_URL = 'https://ssl.hot.co.zw'

let cached = {
  token: null,
  refreshToken: null,
  expMs: 0,
}

function getBaseUrl() {
  return process.env.HOT_BASE_URL || DEFAULT_BASE_URL
}

function decodeJwtExpMs(jwt) {
  try {
    const [, payload] = String(jwt).split('.')
    if (!payload) return 0
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    const expSec = Number(json?.exp || 0)
    return expSec ? expSec * 1000 : 0
  } catch {
    return 0
  }
}

async function hotLogin() {
  const AccessCode = process.env.HOT_ACCESS_CODE
  const Password = process.env.HOT_PASSWORD

  if (!AccessCode) throw new Error('HOT_ACCESS_CODE is not configured')
  if (!Password) throw new Error('HOT_PASSWORD is not configured')

  const url = `${getBaseUrl()}/api/v3/identity/login`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ AccessCode, Password }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const msg = data?.errors?.[0] || data?.message || `Hot login failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.details = data
    throw err
  }

  cached.token = data?.token || null
  cached.refreshToken = data?.refreshToken || null
  cached.expMs = decodeJwtExpMs(cached.token)
  return { token: cached.token, refreshToken: cached.refreshToken, expMs: cached.expMs }
}

async function hotRefresh() {
  if (!cached.token || !cached.refreshToken) return hotLogin()

  const url = `${getBaseUrl()}/api/v3/identity/refresh`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: cached.token, refreshToken: cached.refreshToken }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    // If refresh fails, try a full login next time.
    cached = { token: null, refreshToken: null, expMs: 0 }
    const msg = data?.errors?.[0] || data?.message || `Hot refresh failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.details = data
    throw err
  }

  cached.token = data?.token || null
  cached.refreshToken = data?.refreshToken || null
  cached.expMs = decodeJwtExpMs(cached.token)
  return { token: cached.token, refreshToken: cached.refreshToken, expMs: cached.expMs }
}

export async function getHotBearerToken() {
  const now = Date.now()
  const skewMs = 30_000

  if (cached.token && cached.expMs && now < cached.expMs - skewMs) {
    return cached.token
  }

  // If we have a refresh token, refresh; otherwise login.
  if (cached.refreshToken) {
    try {
      const { token } = await hotRefresh()
      return token
    } catch {
      const { token } = await hotLogin()
      return token
    }
  }

  const { token } = await hotLogin()
  return token
}

export async function hotRechargeProduct({
  agentReference,
  productId,
  target,
  amount,
  customsSMS,
  rechargeOptions,
}) {
  if (!agentReference) throw new Error('agentReference is required')
  if (!productId) throw new Error('productId is required')
  if (!target) throw new Error('target is required')
  if (typeof amount !== 'number') throw new Error('amount must be a number')

  const token = await getHotBearerToken()

  const url = `${getBaseUrl()}/api/v3/products/recharge`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Hot API seems to accept different casing depending on endpoint/version.
      // Send both camelCase and PascalCase to be safe.
      agentReference,
      AgentReference: agentReference,

      // Some responses indicate Hot expects ProductCode.
      productId,
      productCode: productId,
      ProductCode: productId,

      target,
      Target: target,

      amount,
      Amount: amount,

      ...(customsSMS ? { customsSMS, CustomsSMS: customsSMS } : {}),
      ...(Array.isArray(rechargeOptions) && rechargeOptions.length
        ? { rechargeOptions, RechargeOptions: rechargeOptions }
        : {}),
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.errors?.[0] ||
      data?.title ||
      data?.message ||
      `Hot recharge failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.details = data
    throw err
  }

  return data
}
