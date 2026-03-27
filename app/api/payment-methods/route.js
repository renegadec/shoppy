import { NextResponse } from 'next/server'
import { getPaymentMethodSettings } from '@/lib/paymentMethods'

export async function GET() {
  try {
    const methods = await getPaymentMethodSettings()
    return NextResponse.json({ methods })
  } catch (e) {
    // If DB is unavailable, fail open with safe defaults (so checkout still works)
    console.error('payment-methods GET error', e)
    return NextResponse.json({
      methods: [
        { key: 'ecocash', enabled: true, note: null, sortOrder: 1 },
        { key: 'omari', enabled: true, note: null, sortOrder: 2 },
        { key: 'crypto', enabled: true, note: null, sortOrder: 3 },
        { key: 'card', enabled: false, note: 'Coming soon', sortOrder: 4 },
      ],
    })
  }
}
