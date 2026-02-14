/**
 * Hot Recharge Query endpoints (Hot API v3)
 */

import { getHotBearerToken } from '@/lib/hotrecharge'

const DEFAULT_BASE_URL = 'https://ssl.hot.co.zw'

function getBaseUrl() {
  return process.env.HOT_BASE_URL || DEFAULT_BASE_URL
}

export async function hotQueryCustomer({ productId, accountNumber }) {
  if (!productId) throw new Error('productId is required')
  if (!accountNumber) throw new Error('accountNumber is required')

  const token = await getHotBearerToken()

  const url = `${getBaseUrl()}/api/v3/query/customer/${encodeURIComponent(String(productId))}/${encodeURIComponent(String(accountNumber))}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.errors?.[0] ||
      data?.title ||
      data?.message ||
      `Hot customer query failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.details = data
    throw err
  }

  return data
}
