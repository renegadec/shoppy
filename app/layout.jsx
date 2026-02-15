import './globals.css'
import Providers from '@/components/Providers'

const siteName = 'Shoppy'
const siteUrl = 'https://www.shoppy.co.zw'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Digital products, Airtime & ZESA`,
    template: `%s | ${siteName}`,
  },
  description:
    'Buy digital products and Zimbabwe services (airtime, ZESA, event tickets). Pay with crypto (USDT, BTC, ETH) or EcoCash.',

  applicationName: siteName,

  // Social previews
  openGraph: {
    type: 'website',
    url: '/',
    siteName,
    title: `${siteName} | Digital products, Airtime & ZESA`,
    description:
      'Buy digital products and Zimbabwe services (airtime, ZESA, event tickets). Pay with crypto or EcoCash.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | Digital products, Airtime & ZESA`,
    description:
      'Buy digital products and Zimbabwe services (airtime, ZESA, event tickets). Pay with crypto or EcoCash.',
    images: ['/og.png'],
  },

  // Favicons/app icons (served by Next from /app/icon.png and /app/apple-icon.png)
  icons: {
    icon: [{ url: '/icon.png' }],
    apple: [{ url: '/apple-icon.png' }],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
