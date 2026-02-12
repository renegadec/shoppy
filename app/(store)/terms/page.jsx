export const dynamic = 'force-dynamic'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
      <p className="text-gray-600 mt-3">
        This is a starter template you can edit anytime.
      </p>

      <div className="prose prose-gray max-w-none mt-8">
        <h2>1. Overview</h2>
        <p>
          Shoppy provides digital products and is building additional Zimbabwe payment services (airtime, electricity,
          licensing, tickets) to be launched in phases.
        </p>

        <h2>2. Digital delivery</h2>
        <p>
          Delivery timelines depend on the product. If a product requires manual processing, we will contact you using
          the contact method you provide during checkout.
        </p>

        <h2>3. Payments</h2>
        <p>
          Payments are processed via our supported payment providers. Crypto payments may require network confirmations
          before they are marked as paid.
        </p>

        <h2>4. Refunds</h2>
        <p>
          Refund eligibility depends on whether an order has been delivered/fulfilled. If you believe a mistake occurred,
          contact support with your order number.
        </p>

        <h2>5. Support</h2>
        <p>
          For help, contact our support team via the channels listed on the website.
        </p>

        <h2>6. Updates</h2>
        <p>
          These Terms may be updated as our services evolve.
        </p>
      </div>
    </div>
  )
}
