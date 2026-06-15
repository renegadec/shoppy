'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const POLL_INTERVAL = 4000 // 4 seconds
const MAX_POLLS = 45 // 3 minutes total after OTP

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
  const [phase, setPhase] = useState('otp') // 'otp' | 'polling' | 'confirmed' | 'timeout'
  const pollingRef = useRef(false)
  const mountedRef = useRef(true)

  const redirectToSuccess = useCallback(() => {
    if (!mountedRef.current) return
    const base = successHrefForKind[kind] || '/success'
    const next = new URL(base, window.location.origin)
    next.searchParams.set('order', String(orderNumber))
    window.location.href = next.toString()
  }, [kind, orderNumber])

  const checkStatus = useCallback(async () => {
    if (!orderNumber || pollingRef.current) return false
    pollingRef.current = true
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
      const s = String(data?.status?.status || '').toUpperCase()
      if (s === 'SUCCESS') {
        setPhase('confirmed')
        setTimeout(() => {
          if (mountedRef.current) redirectToSuccess()
        }, 1500)
        return true
      }
      return false
    } catch (e) {
      setError(e?.message || 'Failed to check status')
      return false
    } finally {
      pollingRef.current = false
      setChecking(false)
    }
  }, [orderNumber, kind, redirectToSuccess])

  const [pollCount, setPollCount] = useState(0)

  // Auto-poll after OTP is submitted
  useEffect(() => {
    if (phase !== 'polling') return

    const timer = setInterval(() => {
      if (!mountedRef.current || pollingRef.current) return
      checkStatus().then((done) => {
        if (!done && mountedRef.current) {
          setPollCount((c) => c + 1)
        }
      })
    }, POLL_INTERVAL)

    return () => clearInterval(timer)
  }, [phase, pollCount, checkStatus])

  // Timeout check
  useEffect(() => {
    if (phase !== 'polling') return
    if (pollCount >= MAX_POLLS) {
      setPhase('timeout')
    }
  }, [phase, pollCount])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  async function submitOtp(e) {
    e.preventDefault()
    if (!orderNumber || !otp.trim()) return

    setSubmittingOtp(true)
    setError('')
    setPollCount(0)

    try {
      const res = await fetch(`${kindBase[kind] || kindBase.product}/submit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, otp: otp.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to submit OTP')

      setStatus(data?.status || null)
      const s = String(data?.status?.status || '').toUpperCase()
      if (s === 'SUCCESS') {
        setPhase('confirmed')
        setTimeout(() => {
          if (mountedRef.current) redirectToSuccess()
        }, 1500)
      } else {
        // Start polling
        setPhase('polling')
        // Do a quick first check immediately
        checkStatus()
      }
    } catch (e) {
      setError(e?.message || 'Failed to submit OTP')
      setSubmittingOtp(false)
    } finally {
      setSubmittingOtp(false)
    }
  }

  const shortStatus = String(status?.status || '').toUpperCase()

  // --- OTP entry phase ---
  if (phase === 'otp') {
    return (
      <div className="mt-6 mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
        <p className="font-semibold text-gray-900">Omari OTP required</p>
        <p className="text-sm text-gray-700 mt-1">
          Enter the OTP sent by Omari to complete your payment.
        </p>

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

        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </div>
    )
  }

  // --- Polling phase ---
  if (phase === 'polling') {
    return (
      <div className="mt-8 mb-6 text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-semibold text-gray-900">Processing payment...</p>
        <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
          We&apos;ve received your OTP and are confirming the payment.
        </p>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {shortStatus && shortStatus !== 'SUCCESS' && (
          <p className="text-xs text-gray-500 mt-2">
            Status: <span className="font-medium">{shortStatus}</span>
          </p>
        )}
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
        We&apos;re having trouble confirming your Omari payment.
      </p>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={checkStatus}
          disabled={checking}
          className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Check again'}
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
