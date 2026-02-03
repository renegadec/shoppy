'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function CheckoutPage({ params }) {
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  
  const [formData, setFormData] = useState({
    contactMethod: 'telegram',
    contactValue: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
      } finally {
        setLoadingProduct(false)
      }
    }
    fetchProduct()
  }, [params.id])

  if (loadingProduct) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link href="/" className="text-brand-orange hover:text-brand-red mt-4 inline-block">
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

      // Redirect to NOWPayments checkout
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
        className="inline-flex items-center text-brand-orange hover:text-brand-red mb-8"
      >
        <span className="mr-2">←</span>
        Back to Product
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-orange to-brand-red px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
          <p className="text-orange-100">Complete your purchase</p>
        </div>

        <div className="p-8">
          {/* Order Summary */}
          <div className="bg-orange-50 rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {product.image && (
                  <div className="relative w-12 h-12 mr-4">
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
              <p className="text-2xl font-bold text-gray-900">${product.price}</p>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit}>
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-600 text-sm mb-6">
              We'll contact you here after payment to deliver your product and help with setup.
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-shadow"
              />
            </div>

            {/* Contact Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'telegram', label: 'Telegram', icon: '✈️' },
                  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                  { value: 'email', label: 'Email Only', icon: '📧' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, contactMethod: method.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.contactMethod === method.value
                        ? 'border-brand-orange bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-shadow"
                />
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
              className="w-full bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-red hover:to-brand-orange disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay ${product.price} USD with Crypto`
              )}
            </button>

            {/* Payment Info */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>🔒 Secure payment via NOWPayments</p>
              <p className="mt-1">You'll be redirected to complete payment with USDT, BTC, ETH, or other crypto</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
