'use client'

import { useEffect, useState } from 'react'

export default function EcoCashPendingPoll({ kind = 'product', orderNumber }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

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
        // reload the page without pending to show the confirmed UI
        const next = new URL(window.location.href)
        next.searchParams.delete('pending')
        next.searchParams.delete('method')
        window.location.href = next.toString()
      }
    } catch (e) {
      setError(e?.message || 'Failed to check payment status')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    // Poll a few times automatically
    let tries = 0
    const maxTries = 12 // ~1 min if 5s interval

    const t = setInterval(() => {
      tries += 1
      checkOnce()
      if (tries >= maxTries) clearInterval(t)
    }, 5000)

    // initial check
    checkOnce()

    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, kind])

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Checking EcoCash payment…</p>
          <p className="text-sm text-gray-700 mt-1">
            If you already entered your PIN, this page should update automatically.
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

      {status?.status && (
        <p className="text-xs text-gray-600 mt-3">
          Latest status: <span className="font-semibold">{String(status.status)}</span>
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
              <li>Tap <strong>Refresh status</strong> above — sometimes payment completes even if the prompt is missed.</li>
              <li>If nothing happens after a few minutes, contact support with your <strong>order number</strong>.</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="/support"
                className="inline-flex justify-center rounded-xl bg-white border border-emerald-200 text-emerald-900 px-4 py-2 font-semibold hover:bg-emerald-50"
              >
                Read support notes
              </a>
              <a
                href="/contact"
                className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800"
              >
                Contact us
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
