import Image from 'next/image'
import Link from 'next/link'

export default function StoreLayout({ children }) {
  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white sticky top-0 z-50">
        {/* Top bar */}
        <div className="bg-black/20 text-center py-2 text-sm">
          <span className="animate-pulse">🔥</span> Pay with crypto — USDT, BTC, ETH & more! <span className="animate-pulse">🔥</span>
        </div>
        
        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-white rounded-xl p-1.5 shadow-lg group-hover:scale-105 transition-transform">
                <Image 
                  src="/images/logo.png" 
                  alt="Shoppy" 
                  width={32} 
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight">
                shoppy<span className="text-yellow-300">.co.zw</span>
              </span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-yellow-300">💳</span>
                <span className="text-sm font-medium">USDT • BTC • ETH</span>
              </div>
              <Link 
                href="/"
                className="bg-white text-purple-600 px-5 py-2 rounded-full font-semibold hover:bg-yellow-300 hover:text-purple-700 transition-colors shadow-lg"
              >
                Shop Now
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">{children}</main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white rounded-lg p-1">
                  <Image 
                    src="/images/logo.png" 
                    alt="Shoppy" 
                    width={28} 
                    height={28}
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-xl">shoppy<span className="text-yellow-300">.co.zw</span></span>
              </div>
              <p className="text-gray-400 text-sm">
                Premium digital products at unbeatable prices. Pay with crypto!
              </p>
            </div>
            
            {/* Payment Methods */}
            <div>
              <h4 className="font-semibold mb-4 text-yellow-300">We Accept</h4>
              <div className="flex gap-3 text-2xl">
                <span title="USDT">💵</span>
                <span title="Bitcoin">₿</span>
                <span title="Ethereum">⟠</span>
                <span title="More">🪙</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Secure crypto payments via NOWPayments</p>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4 text-yellow-300">Need Help?</h4>
              <p className="text-gray-400 text-sm">
                Reach out via Telegram or WhatsApp for instant support.
              </p>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 Shoppy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
