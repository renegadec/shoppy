'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const POLL_INTERVAL = 5000 // 5 seconds
const MAX_POLLS = 60 // 5 minutes total

const successHrefForKind = {
  product: '/success',
  airtime: '/airtime/success',
  zesa: '/zesa/success',
  ticket: '/tickets/success',
}

export default function EcoCashPendingPoll({ kind = 'product', orderNumber }) {
  const [status, setStatus] = useState(null)
  const [pollCount, setPollCount] = useState(0)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [phase, setPhase] = useState('waiting') // 'waiting' | 'confirmed' | 'timeout'
  const [showHelp, setShowHelp] = useState(false)
  const [resending, setResending] = useState(false)
  const pollingRef = useRef(false)
  const mountedRef = useRef(true)

  const redirectToSuccess = useCallback(() => {
    if (!mountedRef.current) return
    const base = successHrefForKind[kind] || '/success'
    const next = new URL(base, window.location.origin)
    next.searchParams.set('order', String(orderNumber))
    window.location.href = next.toString()
  }, [kind, orderNumber])

  const checkOnce = useCallback(async () => {
    if (!orderNumber || pollingRef.current) return
    pollingRef.current = true
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

      const s = String(
        data?.status?.transactionOperationStatus ||
          data?.status?.status ||
          data?.order?.paymentStatus ||
          ''
      ).toUpperCase()
      if (['COMPLETED', 'SUCCESS', 'SUCCESSFUL', 'PAID', 'CONFIRMED', 'ECOCASH_SUCCESS'].includes(s)) {
        setPhase('confirmed')
        // Short delay so user sees the confirmed state before redirect
        setTimeout(() => {
          if (mountedRef.current) redirectToSuccess()
        }, 1500)
        return true
      }
      return false
    } catch (e) {
      setError(e?.message || 'Failed to check payment status')
      return false
    } finally {
      pollingRef.current = false
      setChecking(false)
    }
  }, [orderNumber, kind, redirectToSuccess])

  // Auto-poll on mount
  useEffect(() => {
    mountedRef.current = true
    setPollCount(0)
    setPhase('waiting')

    // Small initial delay before first poll so page renders
    const initialTimer = setTimeout(() => {
      if (!mountedRef.current) return
      checkOnce().then((done) => {
        if (done) return
      })
    }, 2000)

    return () => {
      mountedRef.current = false
      clearTimeout(initialTimer)
    }
  }, [checkOnce])

  // Continue polling while waiting
  useEffect(() => {
    if (phase !== 'waiting') return
    if (pollCount >= MAX_POLLS) {
      setPhase('timeout')
      return
    }

    const timer = setInterval(() => {
      if (!mountedRef.current || pollingRef.current) return
      checkOnce().then((done) => {
        if (!done && mountedRef.current) {
          setPollCount((c) => c + 1)
        }
      })
    }, POLL_INTERVAL)

    return () => clearInterval(timer)
  }, [phase, pollCount, checkOnce])

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

      setStatus(null)
      setPollCount(0)
      setPhase('waiting')
    } catch (e) {
      setError(e?.message || 'Failed to resend prompt')
    } finally {
      setResending(false)
    }
  }

  const shortStatus = String(status?.transactionOperationStatus || status?.status || '').toUpperCase()
  const showOk = shortStatus && !['COMPLETED', 'SUCCESS', 'SUCCESSFUL', 'PAID', 'CONFIRMED'].includes(shortStatus)

  // --- Loading animation (main state) ---
  if (phase === 'waiting' || (phase !== 'confirmed' && pollCount < MAX_POLLS)) {
    return (
      <div className="mt-8 mb-6 text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-semibold text-gray-900">Waiting for payment...</p>
        <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
          We&apos;ve sent a prompt to your phone. Please check and approve the payment.
        </p>
        {error && pollCount > 3 && (
          <p className="text-sm text-red-600 mt-3">{error}</p>
        )}
        {shortStatus && showOk && (
          <p className="text-xs text-gray-500 mt-2">
            Status: <span className="font-medium">{shortStatus}</span>
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-sm font-semibold text-emerald-800 hover:text-emerald-900"
          >
            {showHelp ? 'Hide help' : "Didn't receive the prompt?"}
          </button>

          {showHelp && (
            <div className="mt-3 text-sm text-gray-700 space-y-2 text-left max-w-sm mx-auto">
              <ul className="list-disc pl-5 space-y-1">
                <li>Check the phone number you entered is correct.</li>
                <li>Wait 30–60 seconds (delays happen during peak times).</li>
                <li>If you already approved, we&apos;re still waiting for confirmation.</li>
                <li>If nothing works, contact support with your order number.</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                <button
                  type="button"
                  onClick={resendPrompt}
                  disabled={resending}
                  className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Send prompt again'}
                </button>
                <a
                  href="/contact"
                  className="inline-flex justify-center rounded-xl bg-white border border-emerald-200 text-emerald-900 px-4 py-2 font-semibold hover:bg-emerald-50"
                >
                  Contact support
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Confirmed / redirecting ---
  if (phase === 'confirmed') {
    return (
      <div className="mt-8 mb-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">Payment confirmed!</p>
        <p className="text-sm text-gray-600 mt-2">Redirecting to your order...</p>
      </div>
    )
  }

  // --- Timeout ---
  return (
    <div className="mt-8 mb-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-900">Still waiting</p>
      <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
        We&apos;ve been checking for a while and haven&apos;t received confirmation yet.
      </p>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={checkOnce}
          disabled={checking}
          className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Check again'}
        </button>
        <button
          type="button"
          onClick={resendPrompt}
          disabled={resending}
          className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800 disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Send prompt again'}
        </button>
        <a
          href="/contact"
          className="inline-flex justify-center rounded-xl bg-white border border-emerald-200 text-emerald-900 px-4 py-2 font-semibold hover:bg-emerald-50"
        >
          Contact support
        </a>
      </div>
    </div>
  )
}
