'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import {
  PaperAirplaneIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/solid'

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  
  const [formData, setFormData] = useState({
    contactMethod: 'telegram',
    contactValue: '',
    email: '',
    paymentMethod: 'crypto',
    customerMsisdn: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id

  useEffect(() => {
    if (!productId) {
      setLoadingProduct(false)
      return
    }

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
        } else {
          // Optional: capture API error for debugging
          const data = await res.json().catch(() => null)
          console.warn('Failed to fetch product:', res.status, data)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
      } finally {
        setLoadingProduct(false)
      }
    }
    fetchProduct()
  }, [productId])

  if (loadingProduct) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link href="/" className="text-emerald-700 hover:text-emerald-800 mt-4 inline-block font-medium">
          ← Back to shop
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        throw new Error('No payment URL received')
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link 
        href={`/product/${product.id}`}
        className="inline-flex items-center text-emerald-700 hover:text-emerald-800 mb-8 font-medium"
      >
        <span className="mr-2">←</span>
        Back to Product
      </Link>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-700 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
          <p className="text-emerald-100">Complete your purchase</p>
        </div>

        <div className="p-8">
          {/* Order Summary */}
          <div className="bg-emerald-50 rounded-xl p-6 mb-8 border border-emerald-100">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {product.image && (
                  <div className="relative w-16 h-16 mr-4 bg-white rounded-lg p-1 shadow-sm">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  {product.period && <p className="text-sm text-gray-500">{product.period} access</p>}
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700">${product.price}</p>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit}>
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-600 text-sm mb-6">
              We&apos;ll contact you here after payment to deliver your product and help with setup.
            </p>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              />
            </div>

            {/* Contact Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'telegram', label: 'Telegram', Icon: PaperAirplaneIcon },
                  { value: 'whatsapp', label: 'WhatsApp', Icon: ChatBubbleOvalLeftEllipsisIcon },
                  { value: 'email', label: 'Email Only', Icon: EnvelopeIcon },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, contactMethod: value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.contactMethod === value
                        ? 'border-emerald-600 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <Icon className="h-7 w-7 mx-auto mb-1 text-emerald-700" aria-hidden="true" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Value (if not email only) */}
            {formData.contactMethod !== 'email' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.contactMethod === 'telegram' ? 'Telegram Username' : 'WhatsApp Number'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactValue}
                  onChange={(e) => setFormData({ ...formData, contactValue: e.target.value })}
                  placeholder={formData.contactMethod === 'telegram' ? '@username' : '+263...'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                />
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
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

            {/* EcoCash phone number */}
            {formData.paymentMethod === 'ecocash' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EcoCash Phone Number (MSISDN)
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerMsisdn}
                  onChange={(e) => setFormData({ ...formData, customerMsisdn: e.target.value })}
                  placeholder="26377xxxxxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use international format without + (e.g. 26377...). You will receive a prompt on your phone.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg hover:shadow-emerald-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : formData.paymentMethod === 'ecocash' ? (
                `Pay $${product.price} with EcoCash`
              ) : formData.paymentMethod === 'card' ? (
                `Pay $${product.price} with Card`
              ) : (
                `Pay $${product.price} with Crypto`
              )}
            </button>

            {/* Payment Info */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p className="flex items-center justify-center gap-2">
                <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                {formData.paymentMethod === 'ecocash'
                  ? 'Secure payment via EcoCash'
                  : 'Secure payment'}
              </p>
              {formData.paymentMethod === 'ecocash' ? (
                <p className="mt-1">We will send a payment prompt to your phone</p>
              ) : formData.paymentMethod === 'crypto' ? (
                <p className="mt-1">Pay with USDT, BTC, ETH, or other crypto</p>
              ) : (
                <p className="mt-1">Payment method coming soon</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
