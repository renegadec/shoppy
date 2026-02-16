import Link from 'next/link'

export const metadata = {
  title: 'Refunds Policy',
}

export default function RefundsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Refunds Policy</h1>
      <p className="mt-3 text-gray-600">
        We aim to be fair and transparent. Refund eligibility depends on the product/service.
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Airtime</h2>
          <p className="text-sm text-gray-600 mt-2">
            Airtime is typically delivered automatically once payment is confirmed. Because airtime is a digital utility,
            refunds may be limited once delivery has completed.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">ZESA tokens</h2>
          <p className="text-sm text-gray-600 mt-2">
            ZESA tokens are processed automatically once payment is confirmed. Refunds may be limited once the token purchase
            has completed.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Event tickets</h2>
          <p className="text-sm text-gray-600 mt-2">
            Ticket refunds depend on the event policy. Where refunds are supported, they are typically available up to a set
            time before the event (minus fees).
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Digital products</h2>
          <p className="text-sm text-gray-600 mt-2">
            Digital products and subscriptions may not be refundable after delivery/activation. If you paid but did not
            receive delivery, contact support with your order number.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="font-semibold text-gray-900">Need help?</h2>
          <p className="text-sm text-gray-700 mt-2">
            If something went wrong, contact us and include your order number and payment details.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link href="/contact" className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800">
              Contact us
            </Link>
            <Link href="/support" className="inline-flex justify-center rounded-xl bg-white border border-gray-200 text-gray-900 px-5 py-3 font-semibold hover:bg-gray-50">
              Support notes
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-emerald-700 font-semibold hover:underline">← Back to home</Link>
      </div>
    </div>
  )
}
