import Image from 'next/image'
import Link from 'next/link'
import { CreditCardIcon } from '@heroicons/react/24/solid'

export default function StoreLayout({ children }) {
  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white sticky top-0 z-50">
        {/* Top bar */}
        <div className="bg-black/20 text-center py-2 text-sm">
         <p>Pay with crypto — USDT, BTC, ETH & more!</p>
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
            
            <nav className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CreditCardIcon className="h-5 w-5 text-yellow-300" aria-hidden="true" />
                <span className="text-sm font-medium">USDT • BTC • ETH</span>
              </div>
              <a 
                href="https://t.me/shoppy_zw"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="text-sm font-medium">Contact Us</span>
              </a>
              <Link 
                href="/"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-5 py-2 rounded-full font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all shadow-lg"
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
      <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white">
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
              <p className="text-gray-400 text-sm mt-2">Secure crypto payments</p>
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
