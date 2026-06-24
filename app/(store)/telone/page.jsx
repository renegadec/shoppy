'use client'

import { useEffect, useState, useCallback } from 'react'
import PaymentMethodPicker from '@/components/PaymentMethodPicker'
import { usePaymentMethods } from '@/lib/usePaymentMethods'
import Link from 'next/link'
import { LockClosedIcon } from '@heroicons/react/24/solid'

export default function TelonePage() {
  const [formData, setFormData] = useState({
    email: '',
    paymentMethod: 'ecocash',
    customerMsisdn: '',
    target: '',
    notifyNumber: '',
    bundleProductCode: '',
    bundleName: '',
    currency: 'USD',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const { methods: paymentMethods, selected: selectedPaymentMethod, setSelected } = usePaymentMethods({
    initialSelected: formData.paymentMethod,
  })

  useEffect(() => {
    if (!selectedPaymentMethod) return
    if (formData.paymentMethod !== selectedPaymentMethod) {
      setFormData((f) => ({ ...f, paymentMethod: selectedPaymentMethod }))
    }
  }, [selectedPaymentMethod, formData.paymentMethod])

  // Fetch bundles / stock
  const [bundles, setBundles] = useState([])
  const [bundlesLoading, setBundlesLoading] = useState(true)
  const [selectedBundle, setSelectedBundle] = useState(null)

  useEffect(() => {
    fetch('/api/telone/bundles')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.stock)) {
          setBundles(data.stock)
        }
      })
      .catch(() => {})
      .finally(() => setBundlesLoading(false))
  }, [])

  function handleBundleSelect(bundle) {
    setSelectedBundle(bundle)
    setFormData((f) => ({
      ...f,
      bundleProductCode: bundle.productCode,
      bundleName: bundle.name,
      amount: bundle.value || '',
    }))
  }

  // Account lookup
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [lookupData, setLookupData] = useState(null)

  const lookup = useCallback(async () => {
    if (!formData.target || formData.target.length < 3) return
    setLookupLoading(true)
    setLookupError('')
    setLookupData(null)
    try {
      const res = await fetch(`/api/telone/lookup?account=${encodeURIComponent(formData.target)}`)
      const data = await res.json()
      if (!res.ok) {
        setLookupError(data.error || 'Lookup failed')
        return
      }
      if (data.account === null && data.note) {
        // Hot doesn't support account lookup for broadband; show info instead of error
        setLookupData({ note: data.note })
      } else {
        setLookupData(data.account)
      }
    } catch {
      setLookupError('Could not reach lookup service')
    } finally {
      setLookupLoading(false)
    }
  }, [formData.target])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)

    if (!selectedBundle) {
      setError('Please select a broadband bundle')
      return
    }
    if (!formData.target) {
      setError('Telone account number is required')
      return
    }
    if (!formData.notifyNumber) {
      setError('Notify number is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/telone/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Checkout failed')
        return
      }

      setSuccess(data)

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Back to home</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Telone Broadband</h1>
          <p className="text-gray-600 mt-2">Recharge your Telone broadband account. Select a bundle and pay securely.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Select bundle */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select a Broadband Bundle</h2>

            {bundlesLoading ? (
              <p className="text-sm text-gray-500">Loading bundles…</p>
            ) : bundles.length === 0 ? (
              <p className="text-sm text-gray-500">No bundles available at the moment.</p>
            ) : (
              <div className="grid gap-3">
                {bundles.map((bundle) => (
                  <label
                    key={bundle.productCode}
                    className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                      selectedBundle?.productCode === bundle.productCode
                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bundle"
                      className="h-4 w-4 text-emerald-700 accent-emerald-700"
                      checked={selectedBundle?.productCode === bundle.productCode}
                      onChange={() => handleBundleSelect(bundle)}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{bundle.name}</p>
                      {bundle.description && (
                        <p className="text-sm text-gray-500">{bundle.description}</p>
                      )}
                      {bundle.value > 0 && (
                        <p className="text-xs font-semibold mt-1" style={{ color: "var(--color-primary, #065f46)" }}>
                          ${bundle.value} / month
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Account details */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Account Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telone Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0242123456"
                  value={formData.target}
                  onChange={(e) => {
                    setFormData((f) => ({ ...f, target: e.target.value }))
                    setLookupData(null)
                  }}
                  onBlur={() => lookup()}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  required
                />
                {lookupLoading && <p className="text-xs text-gray-400 mt-1">Looking up account…</p>}
                {lookupError && <p className="text-xs text-red-500 mt-1">{lookupError}</p>}
                {lookupData && (
                  <div className={`mt-2 rounded-lg p-3 text-sm ${
                    lookupData.note
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    {lookupData.note || 'Account details retrieved.'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notify Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0771234567"
                  value={formData.notifyNumber}
                  onChange={(e) => setFormData((f) => ({ ...f, notifyNumber: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Mobile number to receive recharge notification.</p>
              </div>
            </div>
          </div>

          {/* Step 3: Contact & Payment */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Contact & Payment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Phone Number (for payment) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0771234567"
                  value={formData.customerMsisdn}
                  onChange={(e) => setFormData((f) => ({ ...f, customerMsisdn: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                <PaymentMethodPicker
                  methods={paymentMethods}
                  selected={selectedPaymentMethod}
                  onSelect={setSelected}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedBundle}
            className="w-full rounded-xl bg-emerald-700 text-white font-semibold py-3 px-6 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? 'Processing…' : 'Continue to Payment'}
          </button>

          <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
            <LockClosedIcon className="h-3.5 w-3.5" />
            <span>Secure checkout — powered by Shoppy</span>
          </div>
        </form>
      </div>
    </div>
  )
}
