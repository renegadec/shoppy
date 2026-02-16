import crypto from 'crypto'

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function b64urlJson(obj) {
  return b64url(Buffer.from(JSON.stringify(obj)))
}

export function signScanToken(payload, { ttlSeconds = 60 * 60 * 8 } = {}) {
  const secret = process.env.SCAN_TOKEN_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Missing SCAN_TOKEN_SECRET (or NEXTAUTH_SECRET)')

  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + ttlSeconds }

  const head = b64urlJson(header)
  const bod = b64urlJson(body)
  const data = `${head}.${bod}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest()
  return `${data}.${b64url(sig)}`
}

export function verifyScanToken(token) {
  const secret = process.env.SCAN_TOKEN_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Missing SCAN_TOKEN_SECRET (or NEXTAUTH_SECRET)')

  const parts = String(token || '').split('.')
  if (parts.length !== 3) throw new Error('Invalid token')

  const [head, bod, sig] = parts
  const data = `${head}.${bod}`
  const expected = b64url(crypto.createHmac('sha256', secret).update(data).digest())
  if (sig !== expected) throw new Error('Invalid token signature')

  const json = JSON.parse(Buffer.from(bod.replaceAll('-', '+').replaceAll('_', '/'), 'base64').toString('utf8'))
  const now = Math.floor(Date.now() / 1000)
  if (json.exp && now > json.exp) throw new Error('Token expired')
  return json
}
