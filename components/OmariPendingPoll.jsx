'use client'

import { useState } from 'react'

const successHrefForKind = {
  product: '/success',
  airtime: '/airtime/success',
  zesa: '/zesa/success',
  ticket: '/tickets/success',
}

const kindBase = {
  product: '/api/omari',
  airtime: '/api/omari/airtime',
  zesa: '/api/omari/zesa',
  ticket: '/api/omari/ticket',
}

export default function OmariPendingPoll({ kind = 'product', orderNumber }) {
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [submittingOtp, setSubmittingOtp] = useState(false)
  const [checking, setChecking] = useState(false)

  function redirectToSuccess() {
    const base = successHrefForKind[kind] || '/success'
    const next = new URL(base, window.location.origin)
    next.searchParams.set('order', String(orderNumber))
    window.location.href = next.toString()
  }

  async function submitOtp(e) {
    e.preventDefault()
    if (!orderNumber || !otp.trim()) return

    setSubmittingOtp(true)
    setError('')

    try {
      const res = await fetch(`${kindBase[kind] || kindBase.product}/submit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, otp: otp.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to submit OTP')

      setStatus(data?.status || null)
      if (String(data?.status?.status || '').toUpperCase() === 'SUCCESS') {
        redirectToSuccess()
      }
    } catch (e) {
      setError(e?.message || 'Failed to submit OTP')
    } finally {
      setSubmittingOtp(false)
    }
  }

  async function checkStatus() {
    if (!orderNumber) return

    setChecking(true)
    setError('')

    try {
      const res = await fetch(`${kindBase[kind] || kindBase.product}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to check status')

      setStatus(data?.status || null)
      if (String(data?.status?.status || '').toUpperCase() === 'SUCCESS') {
        redirectToSuccess()
      }
    } catch (e) {
      setError(e?.message || 'Failed to check status')
    } finally {
      setChecking(false)
    }
  }

  const shortStatus = String(status?.status || '').toUpperCase()

  return (
    <div className="mt-6 mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
      <div>
        <p className="font-semibold text-gray-900">Omari OTP required</p>
        <p className="text-sm text-gray-700 mt-1">
          Enter the OTP sent by Omari to complete your payment, then refresh the status if needed.
        </p>
      </div>

      <form onSubmit={submitOtp} className="mt-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={submittingOtp || !otp.trim()}
          className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-3 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50"
        >
          {submittingOtp ? 'Submitting…' : 'Submit OTP'}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={checkStatus}
          disabled={checking}
          className="inline-flex justify-center rounded-xl border border-emerald-300 bg-white text-emerald-900 px-4 py-2 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Refresh status'}
        </button>
        {shortStatus ? (
          <p className="text-xs text-gray-600">
            Status: <span className="font-semibold">{shortStatus}</span>
            {status?.paymentReference ? ` • Ref: ${status.paymentReference}` : ''}
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-700 mt-3">{error}</p> : null}
    </div>
  )
}
