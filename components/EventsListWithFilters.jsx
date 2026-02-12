'use client'

import { useMemo, useState } from 'react'
import EventCard from '@/components/EventCard'

const TABS = ['All', 'Concert', 'Fitness', 'Standup', 'Exhibitions', 'Conference', 'Other']

export default function EventsListWithFilters({ events, formatEventDate }) {
  const [tab, setTab] = useState('All')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    return (events || []).filter((ev) => {
      const cat = ev.category || 'Other'
      if (tab !== 'All' && cat !== tab) return false

      if (!query) return true
      const hay = `${ev.title || ''} ${ev.subtitle || ''} ${ev.city || ''} ${ev.venue || ''} ${cat}`.toLowerCase()
      return hay.includes(query)
    })
  }, [events, q, tab])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                tab === t
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="w-full sm:max-w-sm">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
            className="w-full rounded-2xl bg-white text-gray-900 px-4 py-3 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((event) => {
          const activePrices = (event.ticketTypes || []).map((t) => t.price).filter((p) => typeof p === 'number')
          const from = activePrices.length ? Math.min(...activePrices) : null
          return (
            <EventCard
              key={event.slug}
              event={event}
              dateLabel={event.startsAt ? formatEventDate(event.startsAt) : null}
              fromPriceLabel={from != null ? (from <= 0 ? 'FREE' : `USD ${from}`) : null}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-600 mt-8 text-sm">No events match your filters.</p>
      )}
    </div>
  )
}
