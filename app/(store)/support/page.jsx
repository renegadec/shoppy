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
            href="https://t.me/useshoppy"
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
        <h2 className="font-semibold text-gray-900">Quick notes (read this first)</h2>

        <div className="mt-4 grid grid-cols-1 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900">Crypto payments</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 list-disc pl-5">
              <li>Make sure you pay on the <strong>exact network</strong> shown on the invoice (e.g. TRC20 vs BSC). Wrong network = delays.</li>
              <li>Always send the <strong>exact amount</strong> requested. If you underpay, the order may stay pending.</li>
              <li>Some coins require <strong>confirmations</strong> before we can mark your order as paid. This can take a few minutes.</li>
              <li>If your wallet says “sent” but Shoppy still shows pending, send us your <strong>order number</strong> and the <strong>transaction hash</strong>.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Delivery timelines</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 list-disc pl-5">
              <li><strong>Airtime</strong> and <strong>ZESA tokens</strong>: usually delivered automatically once payment is confirmed.</li>
              <li><strong>Event tickets</strong>: delivered by email after payment confirmation.</li>
              <li><strong>Digital products</strong>: delivery details depend on the product (check the product page). If needed, we’ll contact you via your chosen method.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">When contacting support</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 list-disc pl-5">
              <li>Share your <strong>order number</strong> (e.g. AIR-…, ZESA-…, EVT-…, SHP-…).</li>
              <li>For crypto: include the <strong>tx hash</strong> and the coin/network used.</li>
              <li>For EcoCash: tell us the phone number used and the time you attempted payment.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-emerald-700 font-semibold hover:underline">← Back to home</Link>
      </div>
    </div>
  )
}
