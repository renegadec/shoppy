'use client'

import { useState } from 'react'

const successHrefForKind = {
  product: '/success',
  airtime: '/airtime/success',
  zesa: '/zesa/success',
  ticket: '/tickets/success',
}

export default function EcoCashPendingPoll({ kind = 'product', orderNumber }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [resending, setResending] = useState(false)

  async function resendPrompt() {
    if (!orderNumber) return
    setResending(true)
    setError('')

    try {
      const res = await fetch('/api/ecocash/resend-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, orderNumber }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to resend prompt')

      // Optional: after requesting a new prompt, allow the user to refresh status.
      setStatus(null)
    } catch (e) {
      setError(e?.message || 'Failed to resend prompt')
    } finally {
      setResending(false)
    }
  }

  async function checkOnce() {
    if (!orderNumber) return
    setChecking(true)
    setError('')

    try {
      const url = kind === 'ticket'
        ? '/api/ecocash/ticket-status'
        : kind === 'airtime'
          ? '/api/ecocash/airtime-status'
          : kind === 'zesa'
            ? '/api/ecocash/zesa-status'
            : '/api/ecocash/status'

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to check status')

      setStatus(data?.status || null)

      const s = String(data?.status?.status || '').toUpperCase()
      if (s === 'SUCCESS') {
        const base = successHrefForKind[kind] || '/success'
        const next = new URL(base, window.location.origin)
        next.searchParams.set('order', String(orderNumber))
        window.location.href = next.toString()
      }
    } catch (e) {
      setError(e?.message || 'Failed to check payment status')
    } finally {
      setChecking(false)
    }
  }

  const shortStatus = String(status?.status || '').toUpperCase()
  const showOk = shortStatus && shortStatus !== 'SUCCESS'

  return (
    <div className="mt-6 mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">EcoCash payment pending</p>
          <p className="text-sm text-gray-700 mt-1">
            After you approve the payment on your phone, tap <strong>Refresh status</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={checkOnce}
          disabled={checking}
          className="shrink-0 inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Refresh status'}
        </button>
      </div>

      {showOk && (
        <p className="text-xs text-gray-600 mt-3">
          Status: <span className="font-semibold">{shortStatus}</span>
          {status?.ecocashReference ? ` • Ref: ${status.ecocashReference}` : ''}
        </p>
      )}

      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}

      <div className="mt-4 pt-4 border-t border-emerald-200">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="text-sm font-semibold text-emerald-800 hover:text-emerald-900"
        >
          {showHelp ? 'Hide help' : "Didn't receive the EcoCash prompt?"}
        </button>

        {showHelp && (
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirm the phone number you entered is correct and on EcoCash.</li>
              <li>Wait 30–60 seconds (prompts can be delayed during peak times).</li>
              <li>If you already approved payment, tap <strong>Refresh status</strong> above.</li>
              <li>If nothing happens after a few minutes, contact support with your <strong>order number</strong>.</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={resendPrompt}
                disabled={resending}
                className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800 disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Send prompt again'}
              </button>
              <a
                href="/support"
                className="inline-flex justify-center rounded-xl bg-white border border-emerald-200 text-emerald-900 px-4 py-2 font-semibold hover:bg-emerald-50"
              >
                Read support notes
              </a>
              <a
                href="/contact"
                className="inline-flex justify-center rounded-xl bg-white border border-emerald-200 text-emerald-900 px-4 py-2 font-semibold hover:bg-emerald-50"
              >
                Contact us
              </a>
            </div>
            <p className="text-xs text-gray-600 mt-2">Only request a new prompt if you haven’t approved a payment already.</p>
          </div>
        )}
      </div>
    </div>
  )
}
