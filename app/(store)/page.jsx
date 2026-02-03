import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'

// Disable caching so new products show immediately
export const dynamic = 'force-dynamic'

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100 flex items-center justify-center">
        {product.image && (
          <div className="relative w-36 h-36 group-hover:scale-110 transition-transform duration-300">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>
        )}
        {product.popular && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
            🔥 HOT
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
                <span className="text-purple-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Price */}
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">${product.price}</span>
          {product.period && <span className="text-gray-500 ml-2">/ {product.period}</span>}
        </div>

        {/* CTA Button */}
        <Link
          href={`/product/${product.id}`}
          className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-center font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
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
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 text-white py-16 -mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Premium Digital Products
            <span className="block text-yellow-300">At Unbeatable Prices</span>
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto mb-8">
            Get access to the best productivity tools and AI subscriptions. 
            Pay securely with crypto — USDT, BTC, ETH and more.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">
              <span className="mr-2">🔒</span>
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">
              <span className="mr-2">⚡</span>
              <span className="text-sm font-medium">Instant Delivery</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">
              <span className="mr-2">💬</span>
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h2>
          <p className="text-gray-600">Choose from our curated selection of premium digital products</p>
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
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to get started? 🚀
          </h3>
          <p className="text-gray-800 mb-6">
            Browse our products and pay with your favorite cryptocurrency
          </p>
          <div className="flex justify-center gap-4 text-3xl">
            <span title="USDT">💵</span>
            <span title="Bitcoin">₿</span>
            <span title="Ethereum">⟠</span>
            <span title="More">🪙</span>
          </div>
        </div>
      </div>
    </div>
  )
}
