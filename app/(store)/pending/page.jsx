import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'Payment Pending | Shoppy',
}

export default async function PendingPage({ searchParams }) {
  const sp = await searchParams
  const method = sp?.method || ''
  const orderNumber = sp?.order || ''

  const description = method === 'ecocash'
    ? "We've sent a payment prompt to your phone. Please confirm the EcoCash payment, then refresh the status below."
    : 'Your payment is being processed. Please wait for confirmation.'

  return (
    <SuccessShell
      pending
      description={description}
      backHref="/"
      backLabel="Back to Shop"
      steps={[
        'Confirm the payment on your phone (if prompted)',
        'Tap Refresh status to confirm payment',
        'Once confirmed, we’ll proceed with delivery automatically',
      ]}
    >
      {method === 'ecocash' && orderNumber ? (
        <EcoCashPendingPoll kind="product" orderNumber={orderNumber} />
      ) : null}
    </SuccessShell>
  )
}
