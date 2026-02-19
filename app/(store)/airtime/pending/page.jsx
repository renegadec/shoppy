import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'Airtime Payment Pending | Shoppy',
}

export default async function AirtimePendingPage({ searchParams }) {
  const sp = await searchParams
  const method = sp?.method || ''
  const orderNumber = sp?.order || ''

  const description = method === 'ecocash'
    ? "We've sent a payment prompt to your phone. Please confirm the EcoCash payment, then refresh the status below to complete your airtime order."
    : 'Your payment is being processed. Please wait for confirmation.'

  return (
    <SuccessShell
      pending
      description={description}
      backHref="/airtime"
      backLabel="Back to Airtime"
      steps={[
        'Confirm the payment on your phone',
        'Refresh status to confirm payment',
        'We automatically deliver airtime to the recipient number',
      ]}
    >
      {method === 'ecocash' && orderNumber ? (
        <EcoCashPendingPoll kind="airtime" orderNumber={orderNumber} />
      ) : null}
    </SuccessShell>
  )
}
