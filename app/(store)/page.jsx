import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { LockClosedIcon, ClockIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid'

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
              <span className="mr-2"><LockClosedIcon className="w-5 h-5" /></span>
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">
              <span className="mr-2"><ClockIcon className="w-5 h-5" /></span>
              <span className="text-sm font-medium">Instant Delivery</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">
              <span className="mr-2"><QuestionMarkCircleIcon className="w-5 h-5" /></span>
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
      <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to get started? 🚀
          </h3>
          <p className="text-white/80 mb-8">
            Browse our products and pay with your favorite cryptocurrency
          </p>
          <div className="flex justify-center gap-6 text-4xl mb-8">
            <span title="USDT" className="hover:scale-110 transition-transform cursor-pointer">
              <svg width="30px" height="30px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
                </g>
              </svg>
            </span>
            <span title="Bitcoin" className="hover:scale-110 transition-transform cursor-pointer">
              <svg width="30px" height="30px" viewBox="0 -0.5 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M33.2538 16.1292C33.2538 25.0371 26.0329 32.2584 17.1255 32.2584C8.21799 32.2584 0.99707 25.0371 0.99707 16.1292C0.99707 7.22128 8.21799 0 17.1255 0C26.0329 0 33.2538 7.22128 33.2538 16.1292ZM21.0002 10.1366C23.2438 10.9071 24.8849 12.0607 24.5629 14.2077C24.3291 15.7799 23.4543 16.5403 22.2921 16.8065C23.8866 17.6335 24.4301 19.2029 23.9251 21.1005C22.9664 23.8314 20.6874 24.0613 17.6562 23.4905L16.9202 26.4261L15.1434 25.9844L15.8693 23.0882C15.4087 22.9742 14.9379 22.8522 14.4529 22.7221L13.724 25.6325L11.9492 25.1908L12.6842 22.2491L9.10534 21.3496L9.98817 19.3226C9.98817 19.3226 11.2982 19.6685 11.28 19.6433C11.7832 19.7673 12.0069 19.4406 12.095 19.2238L14.0895 11.256C14.1117 10.8798 13.9811 10.4059 13.2613 10.2264C13.2886 10.2072 11.9705 9.90669 11.9705 9.90669L12.4433 8.01585L16.0272 8.90026L16.7562 5.99188L18.532 6.43358L17.8182 9.28448C18.2961 9.39238 18.776 9.5023 19.2427 9.61828L19.9514 6.78553L21.7282 7.22724L21.0002 10.1366ZM16.7488 14.9882C17.9591 15.3091 20.5928 16.0074 21.0519 14.1765C21.5202 12.3033 18.9615 11.7376 17.7087 11.4606L17.7086 11.4606L17.7085 11.4606C17.5666 11.4292 17.4414 11.4015 17.3393 11.3761L16.4545 14.9117C16.5388 14.9325 16.6378 14.9588 16.7488 14.9882ZM15.3775 20.6807C16.8271 21.0626 19.9976 21.8977 20.5021 19.8803C21.0185 17.8175 17.9445 17.1305 16.4446 16.7952L16.4441 16.7951C16.2767 16.7577 16.129 16.7247 16.008 16.6946L15.032 20.5913C15.1311 20.6158 15.2472 20.6464 15.3771 20.6806L15.3775 20.6807Z" fill="#F7931A"/>
              </svg>
            </span>
            <span title="Ethereum" className="hover:scale-110 transition-transform cursor-pointer">
              <svg width="30px" height="30px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                  <circle cx="16" cy="16" r="16" fill="#627EEA"/>
                  <g fill="#FFF" fillRule="nonzero">
                    <path fillOpacity=".602" d="M16.498 4v8.87l7.497 3.35z"/>
                    <path d="M16.498 4L9 16.22l7.498-3.35z"/>
                    <path fillOpacity=".602" d="M16.498 21.968v6.027L24 17.616z"/>
                    <path d="M16.498 27.995v-6.028L9 17.616z"/>
                    <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z"/>
                    <path fillOpacity=".602" d="M9 16.22l7.498 4.353v-7.701z"/>
                  </g>
                </g>
              </svg>
            </span>
          </div>
          <a 
            href="https://t.me/shoppyzw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-3 rounded-full font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all shadow-lg"
          >
            {/* Telegram Icon */}
            <svg width="25px" height="25px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="url(#paint0_linear_87_7225)"/>
              <path d="M22.9866 10.2088C23.1112 9.40332 22.3454 8.76755 21.6292 9.082L7.36482 15.3448C6.85123 15.5703 6.8888 16.3483 7.42147 16.5179L10.3631 17.4547C10.9246 17.6335 11.5325 17.541 12.0228 17.2023L18.655 12.6203C18.855 12.4821 19.073 12.7665 18.9021 12.9426L14.1281 17.8646C13.665 18.3421 13.7569 19.1512 14.314 19.5005L19.659 22.8523C20.2585 23.2282 21.0297 22.8506 21.1418 22.1261L22.9866 10.2088Z" fill="white"/>
              <defs>
              <linearGradient id="paint0_linear_87_7225" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#37BBFE"/>
              <stop offset="1" stopColor="#007DBB"/>
              </linearGradient>
              </defs>
            </svg>
            Contact Us on Telegram
          </a>
        </div>
      </div>
    </div>
  )
}
