import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import {
  FireIcon,
  CheckCircleIcon,
  CheckIcon,
  CreditCardIcon,
  LockClosedIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/solid'

export const dynamic = 'force-dynamic'

async function getProduct(id) {
  console.log('getProduct', id)

  if(!id || typeof id !== 'string') return null

  const product = await prisma.product.findUnique({
    where: { id }
  })
  return product
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Product Not Found' }

  return {
    title: `${product.name} | Shoppy`,
    description: product.shortDescription,
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params

  const product = await getProduct(id)
  
  if (!product || !product.active) {
    notFound()
  }

  const highlights = product.highlights || []
  const features = product.features || []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 mb-8 font-medium"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to Shop
      </Link>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Product Header with Image */}
        <div className="relative h-72 bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          {product.image && (
            <div className="relative w-48 h-48">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
          )}
          {product.popular && (
            <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md animate-pulse">
              <FireIcon className="h-4 w-4" aria-hidden="true" />
              POPULAR CHOICE
            </span>
          )}
        </div>

        <div className="p-8">
          {/* Title & Price */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600">{product.shortDescription}</p>
            </div>
            <div className="mt-4 md:mt-0 md:text-right">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">${product.price}</span>
                {product.period && <span className="text-gray-500 ml-2">/ {product.period}</span>}
              </div>
            </div>
          </div>

          {/* Tagline */}
          {product.tagline && (
            <p className="text-lg text-gray-700 mb-6">{product.tagline}</p>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What You Get</h2>
              <div className="space-y-4">
                {highlights.map((item, i) => (
                  <div key={i} className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-3 mt-1" aria-hidden="true" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Features Included</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <CheckIcon className="h-5 w-5 text-emerald-600 mr-3" aria-hidden="true" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-gray-900" aria-hidden="true" />
              Payment Information
            </h3>
            <p className="text-gray-700 text-sm">
              We accept cryptocurrency payments including USDT, BTC, ETH, and many more. 
              After payment confirmation, we&apos;ll contact you via your preferred method to deliver your product.
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href={`/checkout/${product.id}`}
            className="block w-full bg-emerald-700 hover:bg-emerald-800 text-white text-center font-bold py-4 px-6 rounded-xl text-lg transition-colors shadow-sm"
          >
            Buy Now — ${product.price}
          </Link>

          {/* Trust Note */}
          <p className="text-center text-gray-500 text-sm mt-4 flex items-center justify-center gap-2">
            <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
            Secure payment via NOWPayments
          </p>
        </div>
      </div>
    </div>
  )
}
