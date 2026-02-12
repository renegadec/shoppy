'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LockClosedIcon } from '@heroicons/react/24/solid'

export default function TicketCheckoutClient() {
  const sp = useSearchParams()

  const eventId = sp.get('eventId')
  const ticketTypeId = sp.get('ticketTypeId')
  const initialQty = Number(sp.get('qty') || 1)
  const isFree = sp.get('free') === '1'

  const [qty, setQty] = useState(Math.max(1, initialQty))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    return Boolean(eventId && ticketTypeId && name && email && qty >= 1)
  }, [eventId, ticketTypeId, name, email, qty])

  useEffect(() => {
    setQty(Math.max(1, initialQty))
  }, [initialQty])

  async function submit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tickets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          email,
          eventId,
          ticketTypeId,
          quantity: qty,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to start checkout')

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      throw new Error('No redirect URL returned')
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/events" className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 font-medium">
        ← Back to events
      </Link>

      <div className="mt-6 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Ticket checkout</h1>
        <p className="text-gray-600 mt-2">
          {isFree ? 'This is a free event. Enter your details to receive your ticket.' : 'Enter your details and pay to receive your QR ticket(s).'}
        </p>

        <form onSubmit={submit} className="mt-8">
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full rounded-2xl bg-gray-50 text-gray-900 px-4 py-3 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-600"
          />

          <label className="block text-sm font-medium text-gray-700 mt-5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="mt-2 w-full rounded-2xl bg-gray-50 text-gray-900 px-4 py-3 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-600"
          />

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-11 w-11 rounded-2xl border border-gray-200 bg-white text-gray-900 font-bold hover:bg-gray-50"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                className="w-24 h-11 rounded-2xl border border-gray-200 bg-white text-gray-900 text-center font-semibold"
              />
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="h-11 w-11 rounded-2xl border border-gray-200 bg-white text-gray-900 font-bold hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="mt-8 w-full inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-bold shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing…' : isFree ? 'Get free ticket' : 'Pay with Crypto'}
          </button>

          {!isFree && (
            <p className="mt-4 text-xs text-gray-500 flex items-center justify-center gap-2">
              <LockClosedIcon className="h-4 w-4" /> Secure payment via NOWPayments
            </p>
          )}

          <p className="mt-2 text-xs text-gray-500 text-center">
            Refund policy: refundable up to 72 hours before the event (minus fees).
          </p>
        </form>
      </div>
    </div>
  )
}
