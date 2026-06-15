import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import OmariPendingPoll from '@/components/OmariPendingPoll'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ticket Payment Pending | Shoppy',
}

export default async function TicketPendingPage({ searchParams }) {
  const sp = await searchParams
  const orderNumber = sp?.order
  const method = sp?.method || ''

  if (!orderNumber || typeof orderNumber !== 'string') notFound()

  const order = await prisma.ticketOrder.findUnique({
    where: { orderNumber },
    include: { event: true, items: { include: { ticketType: true } }, customer: true },
  })

  if (!order) notFound()

  const paid = order.status === 'PAID'
  if (paid) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Payment already confirmed</h1>
          <p className="text-gray-600 mt-2">Redirecting…</p>
          <meta httpEquiv="refresh" content={`0; url=/tickets/success?order=${order.orderNumber}`} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payment pending</h1>
        <p className="text-gray-600 mt-2">
          Order: <span className="font-semibold text-gray-900">{order.orderNumber}</span>
        </p>
        <p className="text-gray-600 mt-1">
          Event: <span className="font-semibold text-gray-900">{order.event.title}</span>
        </p>

        {method === 'omari' ? (
          <OmariPendingPoll kind="ticket" orderNumber={order.orderNumber} />
        ) : method === 'ecocash' ? (
          <EcoCashPendingPoll kind="ticket" orderNumber={order.orderNumber} />
        ) : null}

        <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-200 p-5">
          <p className="font-semibold text-gray-900">What happens next?</p>
          <p className="text-sm text-gray-700 mt-1">
            Once payment is confirmed, we&apos;ll automatically deliver your ticket(s) to{' '}
            <span className="font-medium">{order.customer.email}</span>.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/events/${order.event.slug}`}
            className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800 transition-colors"
          >
            Back to event
          </Link>
          <Link
            href="/events"
            className="inline-flex justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 px-6 py-3 font-semibold hover:bg-gray-50 transition-colors"
          >
            View more events
          </Link>
        </div>
      </div>
    </div>
  )
}
