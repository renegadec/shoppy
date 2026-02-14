import Link from 'next/link'
import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import { CheckCircleIcon, InboxArrowDownIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'

export const metadata = {
  title: 'Airtime Payment | Shoppy',
}

export default async function AirtimeSuccessPage({ searchParams }) {
  const params = await searchParams
  const pending = params?.pending === '1' || params?.pending === 'true'
  const method = params?.method || ''
  const orderNumber = params?.order || ''

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-center p-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-12 w-12 text-green-600" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {pending ? 'Payment Pending' : 'Payment Received!'}
        </h1>

        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {pending ? (
            method === 'ecocash' ? (
              <>We&apos;ve sent a payment prompt to your phone. Please confirm the EcoCash payment to complete your airtime order.</>
            ) : (
              <>Your payment is being processed. Please wait for confirmation.</>
            )
          ) : (
            <>Thanks! Once payment is confirmed, your airtime will be delivered automatically.</>
          )}
        </p>

        {pending && method === 'ecocash' && orderNumber && (
          <EcoCashPendingPoll kind="airtime" orderNumber={orderNumber} />
        )}

        <div className="bg-orange-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-brand-red mb-3 flex items-center gap-2">
            <InboxArrowDownIcon className="h-5 w-5 text-brand-red" aria-hidden="true" />
            What happens next?
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start"><span className="text-brand-orange mr-2">1.</span><span>We verify your payment</span></li>
            <li className="flex items-start"><span className="text-brand-orange mr-2">2.</span><span>We automatically deliver airtime to the recipient number</span></li>
            <li className="flex items-start"><span className="text-brand-orange mr-2">3.</span><span>We send you confirmation via your chosen contact method</span></li>
          </ul>
        </div>

        <Link
          href="/airtime"
          className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-red font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to Airtime
        </Link>
      </div>
    </div>
  )
}
