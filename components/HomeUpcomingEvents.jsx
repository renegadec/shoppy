import Link from 'next/link'
import EventCard from '@/components/EventCard'
import { formatEventDate, getPublicEvents } from '@/lib/eventsStore'

export const dynamic = 'force-dynamic'

export default async function HomeUpcomingEvents() {
  const events = await getPublicEvents()
  const top = events.slice(0, 3)

  return (
    <div className="mt-12">
      <div className="flex items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Upcoming Events</h2>
          <p className="text-gray-600 mt-2">
            Buy tickets from multiple organisers. QR tickets delivered to your email after payment.
          </p>
        </div>
        <Link
          href="/events"
          className="hidden sm:inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {top.map((event) => {
          const activePrices = (event.ticketTypes || []).map((t) => t.price).filter((p) => typeof p === 'number')
          const from = activePrices.length ? Math.min(...activePrices) : null

          return (
            <EventCard
              key={event.slug}
              event={event}
              dateLabel={event.startsAt ? formatEventDate(event.startsAt) : null}
              fromPriceLabel={from != null ? `USD ${from}` : null}
            />
          )
        })}
      </div>

      <div className="mt-6 sm:hidden">
        <Link
          href="/events"
          className="inline-flex w-full justify-center rounded-2xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 transition-colors"
        >
          View all
        </Link>
      </div>
    </div>
  )
}
