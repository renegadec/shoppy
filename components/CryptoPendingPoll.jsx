'use client'

import { useEffect, useMemo, useState } from 'react'

export default function CryptoPendingPoll({ orderNumber, label = 'Crypto payment' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [paid, setPaid] = useState(false)

  const pollUrl = useMemo(() => `/api/crypto/status?order=${encodeURIComponent(orderNumber)}`, [orderNumber])

  useEffect(() => {
    if (!orderNumber) return

    let cancelled = false
    let timer = null

    async function tick() {
      try {
        setLoading(true)
        const res = await fetch(pollUrl, { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Failed to check payment status')
        if (cancelled) return

        setInvoiceUrl(data?.invoiceUrl || '')
        setPaid(Boolean(data?.paid))
        setError('')

        if (data?.paid) {
          // Remove pending/method params and reload page to show confirmed state
          const u = new URL(window.location.href)
          u.searchParams.delete('pending')
          u.searchParams.delete('method')
          window.location.href = u.toString()
          return
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed')
      } finally {
        if (!cancelled) setLoading(false)
      }

      timer = setTimeout(tick, 6000)
    }

    tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [orderNumber, pollUrl])

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left">
      <p className="font-semibold text-gray-900">{label}: pending</p>
      <p className="text-sm text-gray-700 mt-1">
        Keep this page open. Once your payment confirms on-chain, we’ll update this page automatically.
      </p>

      {invoiceUrl && (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800 transition-colors"
        >
          Open payment page
        </a>
      )}

      {loading && <p className="text-xs text-gray-500 mt-3">Checking status…</p>}
      {!loading && !paid && !invoiceUrl && <p className="text-xs text-gray-500 mt-3">Loading payment link…</p>}
      {error && <p className="text-xs text-red-700 mt-3">{error}</p>}
    </div>
  )
}
