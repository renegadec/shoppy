'use client'

import { useEffect, useMemo, useState } from 'react'

function cls(...s) {
  return s.filter(Boolean).join(' ')
}

export default function ScanPage({ params }) {
  const eventSlug = params.slug
  const [token, setToken] = useState('')
  const [event, setEvent] = useState(null)
  const [scanner, setScanner] = useState(null)

  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [input, setInput] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Restore token for this event slug
    try {
      const saved = localStorage.getItem(`scan_token:${eventSlug}`)
      if (saved) setToken(saved)
      const e = localStorage.getItem(`scan_event:${eventSlug}`)
      if (e) setEvent(JSON.parse(e))
      const s = localStorage.getItem(`scan_scanner:${eventSlug}`)
      if (s) setScanner(JSON.parse(s))
    } catch {
      // ignore
    }
  }, [eventSlug])

  const statusUi = useMemo(() => {
    const r = result?.result
    if (r === 'VALID') return { label: 'VALID', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    if (r === 'ALREADY_USED') return { label: 'ALREADY USED', cls: 'bg-amber-100 text-amber-800 border-amber-200' }
    if (r === 'INVALID') return { label: 'INVALID', cls: 'bg-red-100 text-red-800 border-red-200' }
    return null
  }, [result])

  async function login(e) {
    e?.preventDefault?.()
    setLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/scan/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug, username, pin }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Login failed')

      setToken(data.token)
      setEvent(data.event)
      setScanner(data.scanner)

      localStorage.setItem(`scan_token:${eventSlug}`, data.token)
      localStorage.setItem(`scan_event:${eventSlug}`, JSON.stringify(data.event))
      localStorage.setItem(`scan_scanner:${eventSlug}`, JSON.stringify(data.scanner))
    } catch (err) {
      setLoginError(err?.message || 'Login failed')
    } finally {
      setLoggingIn(false)
    }
  }

  async function redeem(e) {
    e?.preventDefault?.()
    setRedeeming(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/scan/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: input }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok && data?.result !== 'INVALID') {
        throw new Error(data?.error || data?.message || 'Failed to verify')
      }

      setResult(data)
      if (!res.ok && data?.result === 'INVALID') {
        // not found counts as a result; keep it in UI
      }

      setInput('')
    } catch (err) {
      setError(err?.message || 'Failed')
    } finally {
      setRedeeming(false)
    }
  }

  const loggedIn = Boolean(token)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ticket Scan</h1>
        <p className="text-gray-600 mt-1">Event: <span className="font-semibold">{event?.title || eventSlug}</span></p>
        {scanner?.username && (
          <p className="text-sm text-gray-500 mt-1">Scanner: <span className="font-mono">{scanner.username}</span></p>
        )}
      </div>

      {!loggedIn ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Login</h2>
          <p className="text-sm text-gray-600 mt-1">Use the username + PIN provided for this event.</p>

          <form onSubmit={login} className="mt-5 space-y-3">
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Username (e.g. GateA)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              type="password"
            />

            {loginError && <p className="text-sm text-red-700">{loginError}</p>}

            <button
              type="submit"
              disabled={loggingIn || !username || !pin}
              className="w-full inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 disabled:opacity-50"
            >
              {loggingIn ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Verify ticket</h2>
            <p className="text-sm text-gray-600 mt-1">
              Scan the QR using any QR scanner app and paste the result here (or type the ticket code).
            </p>

            <form onSubmit={redeem} className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Paste QR payload or ticket code (e.g. TCK-ABC123)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoCapitalize="characters"
              />
              <button
                type="submit"
                disabled={redeeming || !input}
                className="shrink-0 inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 disabled:opacity-50"
              >
                {redeeming ? 'Checking…' : 'Check in'}
              </button>
            </form>

            {error && <p className="text-sm text-red-700 mt-3">{error}</p>}

            {statusUi && (
              <div className={cls('mt-5 rounded-2xl border p-4', statusUi.cls)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{statusUi.label}</p>
                    {result?.ticketCode && <p className="text-sm mt-1">Ticket: <span className="font-mono">{result.ticketCode}</span></p>}
                    {result?.ticketType && <p className="text-sm">Type: <span className="font-semibold">{result.ticketType}</span></p>}
                    {result?.attendee && <p className="text-sm">Attendee: <span className="font-semibold">{result.attendee}</span></p>}
                    {result?.redeemedAt && <p className="text-xs mt-2 opacity-80">Redeemed at: {new Date(result.redeemedAt).toLocaleString()}</p>}
                    {result?.message && <p className="text-sm mt-2">{result.message}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-sm text-gray-700">
              Tip: if you want in-camera scanning inside the page, we can add it next. This version keeps it reliable across devices by accepting pasted QR output.
            </p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-gray-900 hover:underline"
              onClick={() => {
                localStorage.removeItem(`scan_token:${eventSlug}`)
                localStorage.removeItem(`scan_event:${eventSlug}`)
                localStorage.removeItem(`scan_scanner:${eventSlug}`)
                setToken('')
                setEvent(null)
                setScanner(null)
              }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
