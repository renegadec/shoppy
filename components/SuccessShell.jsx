import Link from 'next/link'
import { CheckCircleIcon, InboxArrowDownIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'

export default function SuccessShell({
  title,
  description,
  backHref = '/',
  backLabel = 'Back',
  pending = false,
  pendingTitle = 'Payment Pending',
  successTitle = 'Payment Received!',
  steps,
  children,
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-center p-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-12 w-12 text-green-600" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {title || (pending ? pendingTitle : successTitle)}
        </h1>

        {description ? (
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>
        ) : null}

        {children}

        {Array.isArray(steps) && steps.length ? (
          <div className="bg-orange-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-brand-red mb-3 flex items-center gap-2">
              <InboxArrowDownIcon className="h-5 w-5 text-brand-red" aria-hidden="true" />
              What happens next?
            </h2>
            <ul className="space-y-2 text-gray-700">
              {steps.map((s, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-brand-orange mr-2">{idx + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <p className="text-gray-600">
            <strong>Need help?</strong> If you don&apos;t hear from us within 24 hours, please reach out and we&apos;ll sort it out right away.
          </p>
        </div>

        <Link href={backHref} className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-red font-medium">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
