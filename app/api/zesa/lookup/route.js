import { NextResponse } from 'next/server'
import { hotQueryCustomer } from '@/lib/hotQuery'

export async function POST(request) {
  try {
    const body = await request.json()
    const { meterNumber } = body

    if (!meterNumber) {
      return NextResponse.json({ error: 'meterNumber is required' }, { status: 400 })
    }

    // ZETDC USD productId
    const productId = 41

    const data = await hotQueryCustomer({
      productId,
      accountNumber: String(meterNumber),
    })

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('ZESA lookup error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
