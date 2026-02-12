import Link from 'next/link'
import { TicketIcon } from '@heroicons/react/24/solid'
import { formatEventDate, getPublicEvents } from '@/lib/eventsStore'
import EventsListWithFilters from '@/components/EventsListWithFilters'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getPublicEvents()

  const nextUp = events[0]

  return (
    <div>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                <TicketIcon className="h-4 w-4 text-emerald-700" /> Event Tickets
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mt-4">Upcoming events</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                A simple way to discover events in Zimbabwe and purchase tickets.
              </p>
            </div>
            <Link
              href="/"
              className="hidden sm:inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Back to Home
            </Link>
          </div>

          {nextUp?.startsAt && (
            <p className="text-sm text-gray-500 mt-6">
              Next up: <span className="font-medium text-gray-800">{nextUp.title}</span> • {formatEventDate(nextUp.startsAt)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {events.length > 0 ? (
          <EventsListWithFilters events={events} />
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600">No events listed yet.</p>
          </div>
        )}

        <div className="mt-12 rounded-3xl bg-gray-50 border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Are you an event organiser?</h2>
          <p className="text-sm text-gray-600 mt-1">
            Send us the event name, date/time, venue, ticket types, and prices — we’ll list it.
          </p>
          <div className="mt-4">
            <a
              href="https://t.me/shoppy_zw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 transition-colors"
            >
              Contact Shoppy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
