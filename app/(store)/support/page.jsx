import Link from 'next/link'

export const metadata = {
  title: 'Support',
}

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Support</h1>
      <p className="mt-3 text-gray-600">
        Need help with an order? We’re here.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Fastest support</h2>
          <p className="text-sm text-gray-600 mt-1">Message us on Telegram for quick help.</p>
          <a
            href="https://t.me/shoppy_zw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-4 rounded-xl bg-gray-900 text-white px-4 py-2 font-semibold hover:bg-black"
          >
            Open Telegram
          </a>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Email</h2>
          <p className="text-sm text-gray-600 mt-1">Prefer email? Contact support.</p>
          <a
            href="mailto:support@shoppy.co.zw"
            className="inline-flex mt-4 rounded-xl bg-white border border-gray-200 text-gray-900 px-4 py-2 font-semibold hover:bg-gray-50"
          >
            support@shoppy.co.zw
          </a>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Quick notes</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
          <li>Airtime and ZESA delivery is usually instant once payment is confirmed.</li>
          <li>Tickets are delivered by email after confirmation.</li>
          <li>If you paid but your order is still pending, share your order number with support.</li>
        </ul>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-emerald-700 font-semibold hover:underline">← Back to home</Link>
      </div>
    </div>
  )
}
