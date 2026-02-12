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

export const dynamic = 'force-dynamic'

export default async function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-12 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                <LockClosedIcon className="h-4 w-4 text-gray-800" /> Secure checkout • Mobile-first
              </p>
              <h1 className="text-4xl md:text-6xl font-bold mt-4 leading-[1.05] tracking-tight text-gray-900">
                Simple payments,
                <span className="block">
                  <span className="relative inline-block">
                    <span className="relative z-10">
                      <RotatingWord
                        words={["premium", "trusted", "secure", "modern"]}
                        className="text-emerald-700"
                      />
                    </span>
                    <span className="absolute inset-x-0 -bottom-1 h-3 bg-emerald-100 rounded-md" aria-hidden="true" />
                  </span>
                  <span className="text-gray-900"> experience.</span>
                </span>
              </h1>
              <p className="text-gray-600 mt-5 text-lg max-w-xl">
                Shoppy is building a premium, trusted place to buy subscriptions today — and soon pay for airtime,
                electricity, car licenses, gift cards, and event tickets.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/shop"
                  className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-bold shadow-sm hover:bg-emerald-800 transition-colors"
                >
                  Browse Digital Products
                </Link>
                <a
                  href="https://t.me/shoppy_zw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 px-6 py-3 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Contact Support
                </a>
              </div>

              {/* Trust row */}
              <div className="mt-8 flex gap-3 overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-3 sm:gap-3">
                <div className="min-w-[240px] sm:min-w-0 rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-sm font-semibold text-gray-900">Trust-first</p>
                  <p className="text-xs text-gray-600 mt-1">Clear steps and transparent delivery.</p>
                </div>
                <div className="min-w-[240px] sm:min-w-0 rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <CreditCardIcon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-sm font-semibold text-gray-900">Crypto payments</p>
                  <p className="text-xs text-gray-600 mt-1">USDT • BTC • ETH and more.</p>
                </div>
                <div className="min-w-[240px] sm:min-w-0 rounded-2xl bg-gray-50 border border-gray-200 p-4">
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

          <div className="mt-8 flex gap-4 overflow-x-auto pb-1 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5">
            <div className="min-w-[280px] md:min-w-0 rounded-2xl border border-gray-200 p-6">
              <LockClosedIcon className="h-6 w-6 text-emerald-700" />
              <h3 className="font-semibold text-gray-900 mt-3">Secure checkout</h3>
              <p className="text-sm text-gray-600 mt-1">We use trusted payment infrastructure and keep the flow simple.</p>
            </div>
            <div className="min-w-[280px] md:min-w-0 rounded-2xl border border-gray-200 p-6">
              <PhoneIcon className="h-6 w-6 text-emerald-700" />
              <h3 className="font-semibold text-gray-900 mt-3">Fast support</h3>
              <p className="text-sm text-gray-600 mt-1">Get help quickly via Telegram/WhatsApp when you need it.</p>
            </div>
            <div className="min-w-[280px] md:min-w-0 rounded-2xl border border-gray-200 p-6">
              <TicketIcon className="h-6 w-6 text-emerald-700" />
              <h3 className="font-semibold text-gray-900 mt-3">More services soon</h3>
              <p className="text-sm text-gray-600 mt-1">
                Airtime, electricity, car licenses, gift cards, and event tickets — launching in phases.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white border border-gray-200 p-6">
            <div>
              <p className="font-semibold text-gray-900">Looking for subscriptions & digital tools right now?</p>
              <p className="text-sm text-gray-600 mt-1">Browse our available products (not shown on the homepage).</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800 transition-colors"
            >
              Go to Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
