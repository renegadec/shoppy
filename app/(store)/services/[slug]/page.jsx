import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeftIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid'

const SERVICES = {
  electricity: {
    title: 'Electricity (ZESA Tokens)',
    summary: 'Buy prepaid electricity tokens online. Fast, secure, and mobile-first.',
  },
  airtime: {
    title: 'Airtime Top Up',
    summary: 'Top up airtime for Zimbabwe networks quickly and securely.',
  },
  'car-licenses': {
    title: 'Car Licenses (ZINARA)',
    summary: 'Renew and manage car licensing payments with less friction.',
  },
  'gift-cards': {
    title: 'Gift Cards',
    summary: 'Buy digital gift cards for popular brands (coming soon).',
  },
  'event-tickets': {
    title: 'Event Tickets',
    summary: 'Find events and buy tickets instantly (coming soon).',
  },
}

export const dynamic = 'force-dynamic'

export default async function ServiceComingSoonPage({ params }) {
  const { slug } = await params
  const service = SERVICES[slug]

  if (!service) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 font-medium">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="mt-6 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-white px-8 py-10">
          <p className="text-gray-500 text-sm">Service</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 text-gray-900">{service.title}</h1>
          <p className="text-gray-600 mt-3 max-w-2xl">{service.summary}</p>
          <div className="mt-6 h-px bg-gray-200" />
        </div>

        <div className="p-8">
          <div className="flex items-start gap-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <WrenchScrewdriverIcon className="h-6 w-6 text-emerald-700 mt-0.5" />
            <div>
              <h2 className="font-semibold text-gray-900">Coming soon</h2>
              <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                We’re building this service and launching it in phases. Event tickets are first — browse upcoming events below.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/events"
                  className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 transition-colors"
                >
                  Browse Events
                </Link>
                <a
                  href="https://t.me/shoppy_zw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-xl bg-white border border-gray-200 text-gray-900 px-5 py-3 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 p-5">
              <ShieldCheckIcon className="h-6 w-6 text-gray-900" />
              <h3 className="font-semibold mt-3">Trust first</h3>
              <p className="text-sm text-gray-600 mt-1">Clear pricing, secure payments, and transparent delivery steps.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-900" />
              <h3 className="font-semibold mt-3">Fast support</h3>
              <p className="text-sm text-gray-600 mt-1">If something goes wrong, you can reach us quickly.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5">
              <WrenchScrewdriverIcon className="h-6 w-6 text-gray-900" />
              <h3 className="font-semibold mt-3">Launching soon</h3>
              <p className="text-sm text-gray-600 mt-1">We’ll add services like airtime and electricity as we harden the flow.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
