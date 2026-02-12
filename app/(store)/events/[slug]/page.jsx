import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon, TicketIcon, MapPinIcon, CalendarDaysIcon } from '@heroicons/react/24/solid'
import { formatEventDate, getPublicEventBySlug } from '@/lib/eventsStore'

export const dynamic = 'force-dynamic'

export default async function EventDetailsPage({ params }) {
  const { slug } = await params

  const event = await getPublicEventBySlug(slug)

  if (!event) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/events" className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 font-medium">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Events
      </Link>

      <div className="mt-6 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            <TicketIcon className="h-4 w-4 text-emerald-700" /> Ticketed Event
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">{event.title}</h1>
          {event.subtitle && <p className="text-gray-600 mt-2">{event.subtitle}</p>}
          {event.description && <p className="text-gray-600 mt-3">{event.description}</p>}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <CalendarDaysIcon className="h-5 w-5 text-emerald-700" />
                Date & time
              </div>
              <p className="text-sm text-gray-600 mt-1">{formatEventDate(event.startsAt)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <MapPinIcon className="h-5 w-5 text-emerald-700" />
                Venue
              </div>
              <p className="text-sm text-gray-600 mt-1">{[event.venue, event.city].filter(Boolean).join(' • ') || 'TBA'}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Ticket options</h2>
            <p className="text-sm text-gray-600 mt-1">Tickets are delivered by email as a QR code (after payment confirmation).</p>

            <div className="mt-3 grid grid-cols-1 gap-3">
              {(event.ticketTypes || []).map((t) => (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-200 p-4">
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-600">Mobile QR ticket • Refundable up to 72h before event (minus fees)</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <p className="font-semibold text-emerald-700">{t.currency} {t.price}</p>
                    <Link
                      href={`/tickets/checkout?eventId=${event.id}&ticketTypeId=${t.id}&qty=1`}
                      className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800 transition-colors"
                    >
                      Buy
                    </Link>
                  </div>
                </div>
              ))}

              {(!event.ticketTypes || event.ticketTypes.length === 0) && (
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-gray-700 text-sm">
                  Tickets for this event are not available yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <p className="font-semibold text-gray-900">Organiser?</p>
            <p className="text-sm text-gray-700 mt-1">
              Want better sales and clean ticket delivery? List your event on Shoppy.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a
                href="https://t.me/shoppy_zw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800 transition-colors"
              >
                List your event
              </a>
              <Link
                href="/events"
                className="inline-flex justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 px-6 py-3 font-semibold hover:bg-gray-50 transition-colors"
              >
                Browse events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
