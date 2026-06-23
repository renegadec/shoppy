'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function TelonePendingPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    }>
      <TelonePendingPage />
    </Suspense>
  )
}

function TelonePendingPage() {
  const searchParams = useSearchParams()
  const order = searchParams.get('order')
  const method = searchParams.get('method')

  const [status, setStatus] = useState('pending')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!order) return

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/telone-orders/${order}/retry`, { method: 'POST' })
        const data = await res.json()
        if (data?.order?.status === 'PAID') {
          setStatus('paid')
          clearInterval(poll)
          setTimeout(() => {
            window.location.href = `/telone/success?order=${order}`
          }, 1500)
        }
        if (data?.order?.status === 'FAILED') {
          setStatus('failed')
          setError('Payment was not received')
          clearInterval(poll)
        }
      } catch {}
    }, 5000)

    return () => clearInterval(poll)
  }, [order])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Awaiting Payment</h1>
            <p className="text-sm text-gray-500 mt-2">
              {method === 'ecocash'
                ? 'Complete the payment on your EcoCash app.'
                : 'Complete the payment in your crypto wallet.'}
            </p>
            {order && <p className="text-xs text-gray-400 mt-1 font-mono">{order}</p>}
          </>
        )}

        {status === 'paid' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Confirmed!</h1>
            <p className="text-sm text-gray-500 mt-2">Redirecting…</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
            <p className="text-sm text-red-500 mt-2">{error || 'Something went wrong'}</p>
            <Link
              href="/telone"
              className="mt-6 inline-block rounded-xl bg-emerald-700 text-white px-6 py-2.5 font-semibold hover:bg-emerald-800 transition-colors"
            >
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
