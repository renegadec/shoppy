import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { LockClosedIcon, ClockIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid'

// Disable caching so new products show immediately
export const dynamic = 'force-dynamic'

async function getProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ popular: 'desc' }, { createdAt: 'desc' }],
  })
  return products
}

function ProductCard({ product }) {
  const features = product.features || []

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        {product.image && (
          <div className="relative w-36 h-36 group-hover:scale-110 transition-transform duration-300">
            <Image src={product.image} alt={product.name} fill className="object-contain drop-shadow-lg" />
          </div>
        )}
        {product.popular && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
            HOT
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{product.shortDescription}</p>

        {/* Features Preview */}
        {features.length > 0 && (
          <ul className="space-y-1 mb-4 flex-grow">
            {features.slice(0, 3).map((feature, i) => (
              <li key={i} className="text-sm text-gray-500 flex items-center">
                <span className="text-emerald-600 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Price */}
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-bold text-gray-900">${product.price}</span>
          {product.period && <span className="text-gray-500 ml-2">/ {product.period}</span>}
        </div>

        {/* CTA Button */}
        <Link
          href={`/product/${product.id}`}
          className="block w-full bg-emerald-700 hover:bg-emerald-800 text-white text-center font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

export default async function ShopPage() {
  const products = await getProducts()

  return (
    <div>
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Digital Products</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Premium software & subscriptions. Clean experience. Secure crypto payments.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                <LockClosedIcon className="w-5 h-5 text-gray-900 mr-2" />
                <span className="text-sm font-medium text-gray-900">Secure Payments</span>
              </div>
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                <ClockIcon className="w-5 h-5 text-gray-900 mr-2" />
                <span className="text-sm font-medium text-gray-900">Fast Delivery</span>
              </div>
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                <QuestionMarkCircleIcon className="w-5 h-5 text-gray-900 mr-2" />
                <span className="text-sm font-medium text-gray-900">Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
