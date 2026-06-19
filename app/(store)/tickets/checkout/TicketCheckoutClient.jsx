'use client'

import { useEffect, useMemo, useState } from 'react'
import PaymentMethodPicker from '@/components/PaymentMethodPicker'
import { usePaymentMethods } from '@/lib/usePaymentMethods'
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
  const [paymentMethod, setPaymentMethod] = useState('ecocash')
  const { methods: allPaymentMethods, selected: selectedPaymentMethod } = usePaymentMethods({ initialSelected: paymentMethod })

  useEffect(() => {
    if (!selectedPaymentMethod) return
    if (paymentMethod !== selectedPaymentMethod) setPaymentMethod(selectedPaymentMethod)
  }, [selectedPaymentMethod, paymentMethod])
  const paymentMethods = useMemo(
    () => allPaymentMethods.filter((m) => m.key === 'ecocash' || m.key === 'omari' || m.key === 'crypto'),
    [allPaymentMethods]
  )
  const [customerMsisdn, setCustomerMsisdn] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    if (!(eventId && ticketTypeId && name && email && qty >= 1)) return false
    if (isFree) return true
    if (paymentMethod === 'ecocash' || paymentMethod === 'omari') return Boolean(customerMsisdn)
    return true
  }, [eventId, ticketTypeId, name, email, qty, isFree, paymentMethod, customerMsisdn])

  useEffect(() => {
    setQty(Math.max(1, initialQty))
  }, [initialQty])

  // Payment methods loaded via usePaymentMethods()

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
          paymentMethod,
          customerMsisdn: paymentMethod === 'ecocash' || paymentMethod === 'omari' ? customerMsisdn : undefined,
          currency,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to start checkout')

      if (data.paymentUrl) {
        // For Plisio crypto, we send the customer directly to the hosted payment page.
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
          {!isFree && (
            <div className="mb-6">
              <div className="mt-2">
                <PaymentMethodPicker
                  label="Payment method"
                  methods={paymentMethods}
                  value={paymentMethod}
                  onChange={(key) => setPaymentMethod(key)}
                  gridClassName="grid grid-cols-2 gap-3"
                  descriptions={{
                    crypto: 'Pay with USDT, BTC, ETH, and more',
                    ecocash: 'Pay using your EcoCash wallet',
                    omari: 'Pay using your Omari wallet (OTP required)',
                  }}
                />
              </div>

              {(paymentMethod === 'ecocash' || paymentMethod === 'omari') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {paymentMethod === 'omari' ? 'Omari Number' : 'EcoCash Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerMsisdn}
                    onChange={(e) => setCustomerMsisdn(e.target.value)}
                    placeholder="0773000001"
                    className="mt-2 w-full rounded-2xl bg-gray-50 text-gray-900 px-4 py-3 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-600"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {paymentMethod === 'omari'
                      ? 'Use a valid Omari number. You’ll enter the OTP on the next step.'
                      : 'Use international format without + (e.g. 26377...).'}
                  </p>
                </div>
              )}
            </div>
          )}
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
            {loading
              ? 'Processing…'
              : isFree
                ? 'Get free ticket'
                : paymentMethod === 'ecocash'
                  ? 'Pay with EcoCash'
                  : paymentMethod === 'omari'
                    ? 'Pay with Omari'
                    : 'Pay with Crypto'}
          </button>

          {!isFree && (
            <p className="mt-4 text-xs text-gray-500 flex items-center justify-center gap-2">
              <LockClosedIcon className="h-4 w-4" />{' '}
              {paymentMethod === 'ecocash'
                ? 'Secure payment via EcoCash'
                : paymentMethod === 'omari'
                  ? 'Secure payment via Omari'
                  : 'Secure crypto checkout'}
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
