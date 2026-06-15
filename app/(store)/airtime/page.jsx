'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LockClosedIcon } from '@heroicons/react/24/solid'
import PaymentMethodPicker from '@/components/PaymentMethodPicker'
import { usePaymentMethods } from '@/lib/usePaymentMethods'
import { detectZwNetwork, validateZwMsisdn } from '@/lib/msisdn'

const NETWORK_INFO = {
  econet: { label: 'Econet', color: 'bg-blue-700' },
  netone: { label: 'NetOne', color: 'bg-orange-600' },
  telecel: { label: 'Telecel', color: 'bg-red-600' },
}

export default function AirtimePage() {
  const [formData, setFormData] = useState({
    paymentMethod: 'ecocash',
    customerMsisdn: '',
    network: '',
    recipientMsisdn: '',
    airtimeAmount: '',
  })

  const [recipientValidation, setRecipientValidation] = useState(null)
  const [recipientTouched, setRecipientTouched] = useState(false)
  const [detectedNetwork, setDetectedNetwork] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { methods: paymentMethods, selected: selectedPaymentMethod, setSelected } = usePaymentMethods({
    initialSelected: formData.paymentMethod,
  })

  useEffect(() => {
    if (!selectedPaymentMethod) return
    if (formData.paymentMethod !== selectedPaymentMethod) {
      setFormData((f) => ({ ...f, paymentMethod: selectedPaymentMethod }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPaymentMethod])

  const handleRecipientChange = useCallback((value) => {
    setFormData((f) => ({ ...f, recipientMsisdn: value }))

    // Auto-detect network as user types
    const digits = value.replace(/\D/g, '')
    if (digits.length >= 4) {
      const network = detectZwNetwork(value)
      setDetectedNetwork(network)

      if (network) {
        setFormData((f) => ({ ...f, network: network.id }))
      }
    } else {
      setDetectedNetwork(null)
    }

    // Only show validation after they've typed enough or after blur
    if (recipientTouched && digits.length >= 6) {
      const result = validateZwMsisdn(value)
      setRecipientValidation(result)
    } else {
      setRecipientValidation(null)
    }
  }, [recipientTouched])

  const handleRecipientBlur = useCallback(() => {
    setRecipientTouched(true)
    const result = validateZwMsisdn(formData.recipientMsisdn)
    setRecipientValidation(result)
  }, [formData.recipientMsisdn])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate before submit
    const validation = validateZwMsisdn(formData.recipientMsisdn)
    if (!validation.valid) {
      setError(validation.error)
      setLoading(false)
      setRecipientValidation(validation)
      setRecipientTouched(true)
      return
    }

    if (!formData.network) {
      setError('Could not detect network. Please select one manually.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/airtime/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          airtimeAmount: Number(formData.airtimeAmount),
          recipientMsisdn: validation.normalized,
        }),
      })

      const text = await res.text()
      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || text || 'Failed to start checkout')
      }

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

  const networkInfo = NETWORK_INFO[formData.network]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="inline-flex items-center text-emerald-700 hover:text-emerald-800 mb-8 font-medium"
      >
        ← Back to Home
      </Link>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-8 py-8">
          <h1 className="text-2xl font-bold text-white">Airtime Top Up</h1>
          <p className="text-emerald-200 mt-1">
            Instant airtime for any Zimbabwe mobile number
          </p>
          <div className="mt-5 flex items-center gap-3">
            {[
              { src: '/images/services/econet.png', alt: 'Econet', label: 'Econet' },
              { src: '/images/services/netone.png', alt: 'NetOne', label: 'NetOne' },
              { src: '/images/services/telecel.png', alt: 'Telecel', label: 'Telecel' },
            ].map((l) => (
              <div
                key={l.alt}
                className="rounded-xl bg-white/10 border border-white/15 p-2.5 flex items-center gap-2"
                title={l.alt}
              >
                <Image
                  src={l.src}
                  alt={l.alt}
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
                <span className="text-white text-xs font-medium hidden sm:inline">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Recipient Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.recipientMsisdn}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  onBlur={handleRecipientBlur}
                  placeholder="077xxxxxxx"
                  className={`w-full px-4 py-3 pr-24 border-2 rounded-xl outline-none transition-all ${
                    recipientTouched && recipientValidation && !recipientValidation.valid
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : detectedNetwork
                        ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500'
                  }`}
                />
                {/* Network badge */}
                {detectedNetwork ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
                        NETWORK_INFO[detectedNetwork.id]?.color || 'bg-emerald-600'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {detectedNetwork.label}
                    </span>
                  </div>
                ) : formData.recipientMsisdn.replace(/\D/g, '').length >= 4 ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs text-gray-400">Detecting...</span>
                  </div>
                ) : null}
              </div>

              {/* Validation error */}
              {recipientTouched && recipientValidation && !recipientValidation.valid && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {recipientValidation.error}
                </p>
              )}


            </div>

            {/* Network selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Network</label>
              <div className="relative">
                <select
                  value={formData.network}
                  onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 appearance-none bg-white transition-all"
                >
                  <option value="">Select network</option>
                  {Object.entries(NETWORK_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* Network detected confirmation */}
              {detectedNetwork && networkInfo && (
                <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Detected as{' '}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white ${
                      networkInfo.color
                    }`}
                  >
                    {detectedNetwork.label}
                  </span>
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Airtime Amount (USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-semibold text-lg">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={formData.airtimeAmount}
                  onChange={(e) => setFormData({ ...formData, airtimeAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                  placeholder="1.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                A small markup is added at checkout.
              </p>
            </div>

            {/* Payment method */}
            <div>
              <PaymentMethodPicker
                methods={paymentMethods}
                value={formData.paymentMethod}
                onChange={(key) => {
                  setSelected(key)
                  setFormData({ ...formData, paymentMethod: key })
                }}
                descriptions={{
                  ecocash: 'Pay using your EcoCash wallet',
                  omari: 'Pay using your Omari wallet (OTP required)',
                  crypto: 'Pay with USDT, BTC, ETH, and more',
                  card: 'Pay with card',
                }}
              />
            </div>

            {/* Payer phone */}
            {(formData.paymentMethod === 'ecocash' || formData.paymentMethod === 'omari') && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {formData.paymentMethod === 'omari' ? 'Your Omari Number' : 'Your EcoCash Number'}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerMsisdn}
                  onChange={(e) => setFormData({ ...formData, customerMsisdn: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                  placeholder="077xxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  {formData.paymentMethod === 'omari'
                    ? 'We\'ll send an OTP to this number.'
                    : 'The amount will be deducted from this wallet.'}
                </p>
              </div>
            )}

            {/* Submit error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing…
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 space-y-1">
              <p className="flex items-center justify-center gap-2">
                <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                Secure payment
              </p>
              <p>Instant delivery &middot; No signup required</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
