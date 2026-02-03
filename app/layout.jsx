import './globals.css'
import Image from 'next/image'

export const metadata = {
  title: 'Shoppy | Premium Digital Products',
  description: 'Get premium digital products and subscriptions. Pay with crypto - USDT, BTC, and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <a href="/" className="flex items-center space-x-2">
                <Image 
                  src="/images/logo.png" 
                  alt="Shoppy" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
                <span className="font-bold text-xl text-[#f14624]">shoppy</span>
              </a>
              <nav className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  💳 We accept: <span className="font-medium text-gray-700">USDT • BTC • ETH</span>
                </span>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500 text-sm">
              <p>© 2026 Shoppy. All rights reserved.</p>
              <p className="mt-2">
                Secure payments powered by{' '}
                <a 
                  href="https://nowpayments.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-orange hover:text-brand-red"
                >
                  NOWPayments
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
