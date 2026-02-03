import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'

async function getProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [
      { popular: 'desc' },
      { createdAt: 'desc' }
    ]
  })
  return products
}

function ProductCard({ product }) {
  const features = product.features || []
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
        {product.image && (
          <div className="relative w-36 h-36">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>
        )}
        {product.popular && (
          <span className="absolute top-3 right-3 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            🔥 POPULAR
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
                <span className="text-brand-orange mr-2">✓</span>
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
          className="block w-full bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-red hover:to-brand-orange text-white text-center font-semibold py-3 px-4 rounded-xl transition-all mt-auto"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

export default async function Home() {
  const products = await getProducts()
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Premium Digital Products
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get access to the best productivity tools and AI subscriptions. 
          Pay securely with crypto — USDT, BTC, ETH and more.
        </p>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <span className="mr-2">🔒</span>
          <span className="text-sm text-gray-600">Secure Payments</span>
        </div>
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <span className="mr-2">⚡</span>
          <span className="text-sm text-gray-600">Instant Delivery</span>
        </div>
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <span className="mr-2">💬</span>
          <span className="text-sm text-gray-600">24/7 Support</span>
        </div>
      </div>

      {/* Products Grid */}
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

      {/* Payment Methods */}
      <div className="mt-16 text-center">
        <p className="text-gray-500 mb-4">Accepted Payment Methods</p>
        <div className="flex justify-center gap-6 text-2xl">
          <span title="USDT">💵</span>
          <span title="Bitcoin">₿</span>
          <span title="Ethereum">⟠</span>
          <span title="More crypto">🪙</span>
        </div>
      </div>
    </div>
  )
}
