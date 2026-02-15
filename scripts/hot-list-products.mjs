import fs from 'node:fs'
import path from 'node:path'

// Minimal .env loader (supports KEY=VALUE, ignores comments)
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) continue
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    let val = m[2]
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

const root = process.cwd()
loadEnvFile(path.join(root, '.env.local'))
loadEnvFile(path.join(root, '.env'))

const BASE = process.env.HOT_BASE_URL || 'https://ssl.hot.co.zw'
const AccessCode = process.env.HOT_ACCESS_CODE
const Password = process.env.HOT_PASSWORD

if (!AccessCode || !Password) {
  console.error('Missing HOT_ACCESS_CODE or HOT_PASSWORD in env')
  process.exit(1)
}

async function jsonFetch(url, opts) {
  const res = await fetch(url, opts)
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
  return { ok: res.ok, status: res.status, data }
}

async function login() {
  const url = `${BASE}/api/v3/identity/login`
  const { ok, status, data } = await jsonFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ AccessCode, Password }),
  })
  if (!ok) {
    console.error('Login failed', status, data)
    process.exit(1)
  }
  return data?.token
}

const token = await login()

const endpoints = [
  '/api/v3/products',
  '/api/v3/products/available',
  '/api/v3/products/list',
  '/api/v3/products/all',
  '/api/v3/products/catalog',
]

for (const ep of endpoints) {
  const url = `${BASE}${ep}`
  const { ok, status, data } = await jsonFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  console.log('\n===', ep, '=>', status, ok ? 'OK' : 'FAIL', '===')
  if (!ok) {
    console.log(JSON.stringify(data, null, 2).slice(0, 2000))
    continue
  }

  // Try to summarize product fields without dumping huge payload.
  const items = data?.data || data?.items || data?.products || data
  if (Array.isArray(items)) {
    console.log('count:', items.length)
    console.log('sample keys:', items[0] ? Object.keys(items[0]) : [])
    console.log('first 5:', JSON.stringify(items.slice(0, 5), null, 2).slice(0, 4000))
  } else {
    console.log('keys:', items ? Object.keys(items) : null)
    console.log(JSON.stringify(items, null, 2).slice(0, 4000))
  }
}
