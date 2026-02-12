import Link from 'next/link'
import { CheckCircleIcon, InboxArrowDownIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'

export const metadata = {
  title: 'Payment Successful | Shoppy',
}

export default function SuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-center p-12">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-12 w-12 text-green-600" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Received!
        </h1>

        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Thank you for your purchase! We&apos;ve received your payment and will contact you shortly 
          to deliver your product and help with setup.
        </p>

        {/* What's Next */}
        <div className="bg-orange-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-brand-red mb-3 flex items-center gap-2">
            <InboxArrowDownIcon className="h-5 w-5 text-brand-red" aria-hidden="true" />
            What happens next?
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-brand-orange mr-2">1.</span>
              <span>We&apos;ll verify your payment (usually within a few minutes)</span>
            </li>
            <li className="flex items-start">
              <span className="text-brand-orange mr-2">2.</span>
              <span>We&apos;ll contact you via your preferred method (Telegram/WhatsApp/Email)</span>
            </li>
            <li className="flex items-start">
              <span className="text-brand-orange mr-2">3.</span>
              <span>We&apos;ll deliver your product and help you set it up</span>
            </li>
          </ul>
        </div>

        {/* Support Note */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <p className="text-gray-600">
            <strong>Need help?</strong> If you don&apos;t hear from us within 24 hours, 
            please reach out and we&apos;ll sort it out right away.
          </p>
        </div>

        {/* Back to Shop */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-red font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to Shop
        </Link>
      </div>
    </div>
  )
}
