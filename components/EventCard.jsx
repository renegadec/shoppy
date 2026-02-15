import Link from 'next/link'
import Image from 'next/image'

export default function EventCard({ event, dateLabel, fromPriceLabel }) {
  const location = [event.city, event.venue].filter(Boolean).join(' • ') || 'Zimbabwe'

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-100 via-white to-gray-100" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-gray-800 truncate">
                {event.title}
              </h3>
              {event.subtitle && <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{event.subtitle}</p>}
              {dateLabel && <p className="text-xs text-gray-500 mt-2">{dateLabel}</p>}
            </div>

            {fromPriceLabel && (
              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-500">{fromPriceLabel === 'FREE' ? 'Entry' : 'From'}</p>
                <p className={`text-sm font-semibold whitespace-nowrap ${fromPriceLabel === 'FREE' ? 'text-emerald-700' : 'text-emerald-700'}`}>{fromPriceLabel}</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-xs text-gray-500 truncate">{location}</span>
            <span className="text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">View →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
