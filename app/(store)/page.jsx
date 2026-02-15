import Link from 'next/link'
import {
  LockClosedIcon,
  BoltIcon,
  TicketIcon,
  PhoneIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid'
import ServiceFinder from '@/components/ServiceFinder'
import RotatingWord from '@/components/RotatingWord'
import HomeUpcomingEvents from '@/components/HomeUpcomingEvents'

export const dynamic = 'force-dynamic'

export default async function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-12 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <LockClosedIcon className="h-4 w-4 text-emerald-800" /> Instant delivery • Secure checkout
              </p>
              <h1 className="text-4xl md:text-6xl font-bold mt-4 leading-[1.05] tracking-tight text-gray-900">
                Pay for essential services
                <span className="block">
                  in a <span className="relative inline-block">
                    <span className="relative z-10">
                      <RotatingWord
                        words={["simple", "secure", "fast", "modern"]}
                        className="text-emerald-700"
                      />
                    </span>
                    <span className="absolute inset-x-0 -bottom-1 h-3 bg-emerald-100 rounded-md" aria-hidden="true" />
                  </span>{' '}
                  <span className="text-gray-900">way.</span>
                </span>
              </h1>
              <p className="text-gray-600 mt-5 text-lg max-w-xl">
                Buy airtime, ZESA tokens, and event tickets — plus digital products and subscriptions.
                Pay with crypto or EcoCash, and get clear delivery updates.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/airtime"
                  className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-bold shadow-sm hover:bg-emerald-800 transition-colors"
                >
                  Buy Airtime
                </Link>
                <Link
                  href="/zesa"
                  className="inline-flex justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 px-6 py-3 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Buy ZESA Tokens
                </Link>
              </div>

              <div className="mt-3">
                <Link href="/shop" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Browse digital products →
                </Link>
              </div>

              {/* Trust row */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-sm font-semibold text-gray-900">Trust-first</p>
                  <p className="text-xs text-gray-600 mt-1">Clear steps and transparent delivery.</p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <CreditCardIcon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-sm font-semibold text-gray-900">Pay your way</p>
                  <p className="text-xs text-gray-600 mt-1">Crypto (USDT • BTC • ETH) or EcoCash.</p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <BoltIcon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-sm font-semibold text-gray-900">Fast processing</p>
                  <p className="text-xs text-gray-600 mt-1">Quick turnaround where possible.</p>
                </div>
              </div>
            </div>

            {/* Services picker */}
            <div>
              <ServiceFinder />
            </div>
          </div>
        </div>
      </div>

      {/* Why choose us */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900">Why choose Shoppy?</h2>
            <p className="text-gray-600 mt-3">
              Payments should feel simple and safe. We’re building Shoppy to earn trust first — with a clean experience,
              fast support, and clear delivery.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <LockClosedIcon className="h-6 w-6 text-emerald-700" />
              <h3 className="font-semibold text-gray-900 mt-3">Secure checkout</h3>
              <p className="text-sm text-gray-600 mt-1">We use trusted payment infrastructure and keep the flow simple.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <PhoneIcon className="h-6 w-6 text-emerald-700" />
              <h3 className="font-semibold text-gray-900 mt-3">Fast support</h3>
              <p className="text-sm text-gray-600 mt-1">Get help quickly via Telegram/WhatsApp when you need it.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <TicketIcon className="h-6 w-6 text-emerald-700" />
              <h3 className="font-semibold text-gray-900 mt-3">Built for everyday essentials</h3>
              <p className="text-sm text-gray-600 mt-1">
                Airtime, ZESA tokens, and event tickets — with a clean, mobile-first checkout.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-white border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">Explore what’s available today</p>
                <p className="text-sm text-gray-600 mt-1">
                  Start with services (airtime, ZESA, tickets) or browse our digital products and subscriptions.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/airtime"
                  className="inline-flex justify-center rounded-2xl bg-gray-900 text-white px-5 py-3 font-semibold hover:bg-black transition-colors"
                >
                  Buy Airtime
                </Link>
                <Link
                  href="/zesa"
                  className="inline-flex justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 px-5 py-3 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Buy ZESA Tokens
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 transition-colors"
                >
                  Browse Digital Products
                </Link>
              </div>
            </div>
          </div>

          {/* Upcoming events */}
          <HomeUpcomingEvents />

          {/* How it works */}
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-900">How it works</h3>
            <p className="text-sm text-gray-600 mt-2">
              A simple flow: choose a service, pay securely, get delivery updates.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold text-gray-600">STEP 1</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">Choose a service</p>
                <p className="text-sm text-gray-600 mt-1">Airtime, ZESA tokens, tickets, or digital products.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold text-gray-600">STEP 2</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">Pay securely</p>
                <p className="text-sm text-gray-600 mt-1">Crypto or EcoCash — quick checkout on mobile.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold text-gray-600">STEP 3</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">Receive delivery</p>
                <p className="text-sm text-gray-600 mt-1">Instant where possible, or emailed once confirmed.</p>
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              For event tickets: refundable up to 72 hours before the event (minus fees).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
