'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LockClosedIcon } from '@heroicons/react/24/solid'

const NETWORKS = [
  { value: 'econet', label: 'Econet' },
  { value: 'netone', label: 'NetOne' },
  { value: 'telecel', label: 'Telecel' },
]

export default function AirtimePage() {
  const [formData, setFormData] = useState({
    email: '',
    contactMethod: 'telegram',
    contactValue: '',
    paymentMethod: 'crypto',
    customerMsisdn: '',
    network: 'econet',
    recipientMsisdn: '',
    airtimeAmount: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const airtimeAmountNum = Number(formData.airtimeAmount)
  const customerPays = Number.isFinite(airtimeAmountNum) && airtimeAmountNum > 0
    ? Math.round((airtimeAmountNum * 1.02 + Number.EPSILON) * 100) / 100
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/airtime/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          airtimeAmount: Number(formData.airtimeAmount),
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
          <h1 className="text-2xl font-bold text-white">Airtime Top Up</h1>
          <p className="text-emerald-100">Zimbabwe only • Econet / NetOne / Telecel</p>
        </div>

        <div className="p-8">
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 mb-8">
            <p className="text-sm text-gray-700">
              Recipient gets <span className="font-semibold">the amount you enter</span>. Customer pays <span className="font-semibold">+2% service fee</span>.
            </p>
            {customerPays !== null && (
              <p className="text-sm text-gray-800 mt-2">
                Customer pays: <span className="font-bold">${customerPays}</span>
              </p>
            )}
          </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
              <select
                value={formData.network}
                onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {NETWORKS.map(n => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Phone Number</label>
              <input
                type="tel"
                required
                value={formData.recipientMsisdn}
                onChange={(e) => setFormData({ ...formData, recipientMsisdn: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="077... or 26377..."
              />
              <p className="text-xs text-gray-500 mt-2">Buy for yourself or someone else.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Airtime Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={formData.airtimeAmount}
                onChange={(e) => setFormData({ ...formData, airtimeAmount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g. 1.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'telegram', label: 'Telegram' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'email', label: 'Email Only' },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, contactMethod: m.value })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.contactMethod === m.value
                        ? 'border-emerald-600 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.contactMethod !== 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.contactMethod === 'telegram' ? 'Telegram Username' : 'WhatsApp Number'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactValue}
                  onChange={(e) => setFormData({ ...formData, contactValue: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder={formData.contactMethod === 'telegram' ? '@username' : '+263...'}
                />
              </div>
            )}

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
                  placeholder="26377xxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-2">Use international format without + (e.g. 26377...).</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
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
                <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                Secure payment
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
