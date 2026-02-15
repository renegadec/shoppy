import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getHotBearerToken } from '@/lib/hotrecharge'

async function jsonFetch(url, opts) {
  const res = await fetch(url, opts)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  return { ok: res.ok, status: res.status, data }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const base = process.env.HOT_BASE_URL || 'https://ssl.hot.co.zw'
    const token = await getHotBearerToken()

    const candidates = [
      '/api/v3/products',
      '/api/v3/products/available',
      '/api/v3/products/list',
      '/api/v3/products/all',
      '/api/v3/products/catalog',
    ]

    const results = []

    for (const ep of candidates) {
      const url = `${base}${ep}`
      const resp = await jsonFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      results.push({ endpoint: ep, ok: resp.ok, status: resp.status })

      if (resp.ok) {
        const items = resp.data?.data || resp.data?.items || resp.data?.products || resp.data
        // Only return a small sample to avoid huge payloads.
        const arr = Array.isArray(items) ? items : []
        const sample = arr.slice(0, 50)
        const keys = sample[0] ? Object.keys(sample[0]) : []

        return NextResponse.json({
          endpoint: ep,
          keys,
          count: Array.isArray(items) ? items.length : null,
          sample,
          tried: results,
        })
      }
    }

    return NextResponse.json({ error: 'No products endpoint succeeded', tried: results }, { status: 502 })
  } catch (e) {
    console.error('Hot products debug error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
