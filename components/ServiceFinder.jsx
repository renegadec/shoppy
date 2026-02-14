'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const DEFAULT_SERVICES = [
  {
    slug: 'electricity',
    title: 'Electricity',
    subtitle: 'ZESA Tokens',
  },
  {
    slug: 'airtime',
    title: 'Airtime',
    subtitle: 'Econet, TelOne',
  },
  {
    slug: 'car-licenses',
    title: 'Car Licenses',
    subtitle: 'ZINARA Renewal',
  },
  {
    slug: 'gift-cards',
    title: 'Gift Cards',
    subtitle: 'Digital Vouchers',
  },
  {
    slug: 'event-tickets',
    title: 'Event Tickets',
    subtitle: 'Local Events',
  },
]

function ServiceCard({ service }) {
  const href = service.slug === 'event-tickets'
    ? '/events'
    : service.slug === 'airtime'
      ? '/airtime'
      : service.slug === 'electricity'
        ? '/zesa'
        : `/services/${service.slug}`

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <h3 className="text-base font-semibold text-gray-900">{service.title}</h3>
      <p className="text-sm text-gray-600 mt-1">{service.subtitle}</p>
      <div className="mt-3 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
        View →
      </div>
    </Link>
  )
}

export default function ServiceFinder({ services = DEFAULT_SERVICES }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return services
    return services.filter((s) => {
      const hay = `${s.title} ${s.subtitle}`.toLowerCase()
      return hay.includes(query)
    })
  }, [q, services])

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Which service are you looking for?</h2>
          <p className="text-gray-600 text-sm mt-1">Search and pick a service. More services launching soon.</p>
        </div>
        <div className="w-full md:max-w-md">
          <label className="sr-only" htmlFor="service-search">Search services</label>
          <input
            id="service-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search service… (e.g. airtime, zesa, tickets)"
            className="w-full rounded-2xl bg-gray-50 text-gray-900 placeholder:text-gray-400 px-4 py-3 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-gray-600 text-sm">
          No services matched your search. Try “airtime” or “electricity”.
        </p>
      )}
    </div>
  )
}
