export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="text-gray-600 mt-3">Starter template you can edit anytime.</p>

      <div className="prose prose-gray max-w-none mt-8">
        <h2>1. Data we collect</h2>
        <p>
          We collect the information you provide during checkout (such as email/phone/telegram/whatsapp) to process your
          order and deliver support.
        </p>

        <h2>2. How we use your data</h2>
        <ul>
          <li>To process payments and fulfill orders</li>
          <li>To contact you about your order</li>
          <li>To prevent fraud and keep the platform secure</li>
        </ul>

        <h2>3. Data sharing</h2>
        <p>
          We only share data with service providers as needed to process payments and deliver services.
        </p>

        <h2>4. Retention</h2>
        <p>
          We retain order records for business and compliance purposes.
        </p>

        <h2>5. Contact</h2>
        <p>
          If you have privacy questions, contact our support team.
        </p>
      </div>
    </div>
  )
}
