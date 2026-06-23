import { NextResponse } from 'next/server'
import { hotQueryAccount } from '@/lib/hotrecharge'

const HOT_TELONE_BROADBAND_PRODUCT_ID = 31

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get('account')

    if (!accountNumber) {
      return NextResponse.json({ error: 'Account number is required' }, { status: 400 })
    }

    const data = await hotQueryAccount({
      productId: HOT_TELONE_BROADBAND_PRODUCT_ID,
      accountNumber,
    })

    return NextResponse.json({ account: data })
  } catch (e) {
    console.error('Telone lookup error:', e)
    return NextResponse.json({ error: e?.message || 'Lookup failed' }, { status: 502 })
  }
}
