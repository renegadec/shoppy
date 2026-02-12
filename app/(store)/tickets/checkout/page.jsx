import { Suspense } from 'react'
import TicketCheckoutClient from './TicketCheckoutClient'

export const dynamic = 'force-dynamic'

export default function TicketCheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-600">Loading…</div>}>
      <TicketCheckoutClient />
    </Suspense>
  )
}
