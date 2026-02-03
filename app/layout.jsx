import './globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'Shoppy | Premium Digital Products',
  description: 'Get premium digital products and subscriptions. Pay with crypto - USDT, BTC, and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
