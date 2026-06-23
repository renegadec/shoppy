'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function TeloneSuccessPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    }>
      <TeloneSuccessPage />
    </Suspense>
  )
}

function TeloneSuccessPage() {
  const searchParams = useSearchParams()
  const order = searchParams.get('order')

  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!order) {
      setLoading(false)
      return
    }

    fetch(`/api/admin/telone-orders/${order}/retry`, { method: 'POST' })
      .catch(() => {})

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/invoices/${order}`)
        if (res.ok) {
          const data = await res.json()
          setOrderData(data)
          if (data.delivered || data.status === 'DELIVERED') {
            clearInterval(poll)
          }
        }
      } catch {}
    }, 3000)

    return () => clearInterval(poll)
  }, [order])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>

        {order && (
          <p className="text-sm text-gray-500 mt-2">Order: <span className="font-mono">{order}</span></p>
        )}

        <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            Your Telone Broadband recharge is being processed. You&apos;ll receive a confirmation shortly.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/telone"
            className="rounded-xl bg-emerald-700 text-white px-6 py-2.5 font-semibold hover:bg-emerald-800 transition-colors"
          >
            Buy More Broadband
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-gray-200 text-gray-700 px-6 py-2.5 font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
