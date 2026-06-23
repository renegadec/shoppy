import { NextResponse } from 'next/server'
import { hotQueryStock } from '@/lib/hotrecharge'

const HOT_TELONE_BROADBAND_PRODUCT_ID = 31

export async function GET() {
  try {
    const data = await hotQueryStock({ productId: HOT_TELONE_BROADBAND_PRODUCT_ID })

    const stock = Array.isArray(data?.stock)
      ? data.stock.map((item) => ({
          productCode: item.productCode,
          name: item.name,
          description: item.description,
          value: item.value,
          currency: item.currency,
        }))
      : []

    return NextResponse.json({ stock })
  } catch (e) {
    console.error('Telone bundles fetch error:', e)
    // Fallback bundles based on Telone's Aug 2025 tariff sheet.
    // Product codes are placeholders — replace with real Hot numeric product codes
    // when the Hot account is reactivated.
    const fallback = [
      // Fibre (Unlimited, 3TB FUP)
      { productCode: 11001, name: 'Fibre 50Mbps (Unlimited)', description: '50Mbps fibre broadband — US$40/mo', value: 40, currency: 'USD' },
      { productCode: 11002, name: 'Fibre 80Mbps (Unlimited)', description: '80Mbps fibre broadband — US$60/mo', value: 60, currency: 'USD' },
      { productCode: 11003, name: 'Fibre 100Mbps (Unlimited)', description: '100Mbps fibre broadband — US$90/mo', value: 90, currency: 'USD' },

      // DSL (ADSL)
      { productCode: 12001, name: 'Home 75 (5Mbps)', description: '75GB at 5Mbps — US$15/mo', value: 15, currency: 'USD' },
      { productCode: 12002, name: 'Home Unlimited (5Mbps)', description: 'Unlimited at 5Mbps — US$30/mo', value: 30, currency: 'USD' },

      // Blaze LTE
      { productCode: 13001, name: 'Blaze 75 (25Mbps)', description: '75GB at 25Mbps — US$20/mo', value: 20, currency: 'USD' },
      { productCode: 13002, name: 'Blaze 150 (25Mbps)', description: '150GB at 25Mbps — US$25/mo', value: 25, currency: 'USD' },
      { productCode: 13003, name: 'Blaze 500 (25Mbps)', description: '500GB at 25Mbps — US$50/mo', value: 50, currency: 'USD' },
      { productCode: 13004, name: 'Blaze Unlimited (25Mbps)', description: 'Unlimited at 25Mbps — US$75/mo', value: 75, currency: 'USD' },
    ]
    return NextResponse.json({ stock: fallback, note: 'Fallback data — real bundles will load when Hot account is active' })
  }
}
