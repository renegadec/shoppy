import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AnimatedTick from '@/components/AnimatedTick'

export const dynamic = 'force-dynamic'

import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'

export default async function TicketSuccessPage({ searchParams }) {
  const sp = await searchParams
  const orderNumber = sp?.order
  const pending = sp?.pending === '1' || sp?.pending === 'true'
  const method = sp?.method || ''

  if (!orderNumber || typeof orderNumber !== 'string') notFound()

  const order = await prisma.ticketOrder.findUnique({
    where: { orderNumber },
    include: { event: true, items: { include: { ticketType: true } }, customer: true },
  })

  if (!order) notFound()

  const paid = order.status === 'PAID'
  const showPending = pending && method === 'ecocash' && !paid

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-start gap-4">
          {paid && (
            <div className="shrink-0">
              <AnimatedTick />
            </div>
          )}

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {paid ? 'Payment confirmed' : showPending ? 'Payment pending' : 'Payment received'}
            </h1>
            <p className="text-gray-600 mt-2">
              Order: <span className="font-semibold text-gray-900">{order.orderNumber}</span>
            </p>
            <p className="text-gray-600 mt-1">
              Event: <span className="font-semibold text-gray-900">{order.event.title}</span>
            </p>
          </div>
        </div>

        {showPending && (
          <EcoCashPendingPoll kind="ticket" orderNumber={order.orderNumber} />
        )}

        <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-200 p-5">
          <p className="font-semibold text-gray-900">Next step</p>
          <p className="text-sm text-gray-700 mt-1">
            We’ll deliver your ticket(s) to <span className="font-medium">{order.customer.email}</span>. If you need help,
            contact support.
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

        <p className="text-xs text-gray-500 mt-8">Refund policy: refundable up to 72 hours before the event (minus fees).</p>
      </div>
    </div>
  )
}
