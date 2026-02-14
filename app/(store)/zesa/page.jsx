'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LockClosedIcon } from '@heroicons/react/24/solid'

export default function ZesaPage() {
  const [formData, setFormData] = useState({
    email: '',
    paymentMethod: 'ecocash',
    customerMsisdn: '',
    meterNumber: '',
    notifyNumber: '',
    tokenAmount: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [lookupData, setLookupData] = useState(null)

  async function lookup(meterNumber) {
    const m = String(meterNumber || '').trim()
    if (!m) return

    setLookupLoading(true)
    setLookupError('')
    setLookupData(null)

    try {
      const res = await fetch('/api/zesa/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meterNumber: m }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Lookup failed')

      setLookupData(data?.data || null)
    } catch (e) {
      setLookupError(e?.message || 'Lookup failed')
    } finally {
      setLookupLoading(false)
    }
  }

  // Auto lookup when meter number looks complete (11 digits). Debounced.
  useEffect(() => {
    const meter = String(formData.meterNumber || '').replace(/\D/g, '')

    // Only auto-check when it looks like a ZETDC meter
    if (!/^[0-9]{11}$/.test(meter)) {
      setLookupData(null)
      setLookupError('')
      return
    }

    const t = setTimeout(() => {
      lookup(meter)
    }, 600)

    return () => clearTimeout(t)
  }, [formData.meterNumber])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/zesa/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tokenAmount: Number(formData.tokenAmount),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to start checkout')

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }

      throw new Error('No payment URL returned')
    } catch (e) {
      setError(e?.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="inline-flex items-center text-gray-900 hover:text-gray-700 mb-6 font-medium">
        ← Back to Home
      </Link>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-emerald-700 px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">ZESA Tokens</h1>
              <p className="text-emerald-100">ZETDC prepaid electricity tokens</p>
            </div>

            <div className="shrink-0 rounded-xl bg-white/10 border border-white/20 p-2">
              <Image
                src="/images/services/zesa.png"
                alt="ZESA"
                width={80}
                height={80}
                className="h-10 w-10 object-contain"
                priority={false}
              />
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meter Number (11 digits)</label>
              <input
                type="text"
                required
                value={formData.meterNumber}
                onChange={(e) => {
                  const normalized = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, meterNumber: normalized })
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g. 12345678901"
              />

              {lookupLoading && (
                <p className="mt-2 text-xs text-gray-500">Checking meter…</p>
              )}

              {lookupData && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
                  <p className="text-sm font-semibold text-gray-900">Meter details</p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white border border-emerald-100 p-3">
                      <p className="text-xs text-gray-500">Account name</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {lookupData?.details?.AccountName || 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-100 p-3">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {lookupData?.details?.Status || 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-100 p-3">
                      <p className="text-xs text-gray-500">Account number</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {lookupData?.accountNumber || formData.meterNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-100 p-3">
                      <p className="text-xs text-gray-500">Currency</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {lookupData?.details?.Currency || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {lookupError && (
                <p className="mt-3 text-sm text-red-700">{lookupError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notify Number</label>
              <input
                type="tel"
                required
                value={formData.notifyNumber}
                onChange={(e) => setFormData({ ...formData, notifyNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="077... or 26377..."
              />
              <p className="text-xs text-gray-500 mt-2">Shoppy uses this number to send your token.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="5"
                required
                value={formData.tokenAmount}
                onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g. 10.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'ecocash', label: 'EcoCash' },
                  { value: 'crypto', label: 'Crypto' },
                  { value: 'card', label: 'Card (Soon)', disabled: true },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    disabled={m.disabled}
                    onClick={() => setFormData({ ...formData, paymentMethod: m.value })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.paymentMethod === m.value
                        ? 'border-emerald-600 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                    } ${m.disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-gray-200' : ''}`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{m.label}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {m.value === 'ecocash'
                        ? 'Pay using your EcoCash wallet'
                        : m.value === 'crypto'
                          ? 'Pay with USDT, BTC, ETH, and more'
                          : 'Coming soon'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {formData.paymentMethod === 'ecocash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EcoCash Phone Number (MSISDN)</label>
                <input
                  type="tel"
                  required
                  value={formData.customerMsisdn}
                  onChange={(e) => setFormData({ ...formData, customerMsisdn: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="0773xxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-2">Use international format without + (e.g. 26377...).</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg"
            >
              {loading ? 'Processing…' : 'Proceed to Payment'}
            </button>

            <div className="mt-2 text-center text-sm text-gray-500">
              <p className="flex items-center justify-center gap-2">
                <LockClosedIcon className="h-4 w-4" aria-hidden="true" /> Secure payment
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
