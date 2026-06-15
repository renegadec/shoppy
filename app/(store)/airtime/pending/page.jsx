import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import OmariPendingPoll from '@/components/OmariPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'Airtime Payment Pending | Shoppy',
}

export default async function AirtimePendingPage({ searchParams }) {
  const sp = await searchParams
  const method = sp?.method || ''
  const orderNumber = sp?.order || ''

  const description = method === 'omari'
    ? "We've started your Omari payment. Enter the OTP below to complete your airtime order."
    : method === 'ecocash'
      ? "We've sent a payment prompt to your phone. Approve it to complete your airtime order."
      : 'Your payment is being processed. Please wait for confirmation.'

  return (
    <SuccessShell
      pending
      description={description}
      backHref="/airtime"
      backLabel="Back to Airtime"
      steps={[
        'Confirm the payment on your phone',
        'We automatically check for confirmation',
        'We deliver airtime to the recipient number',
      ]}
    >
      {method === 'omari' && orderNumber ? (
        <OmariPendingPoll kind="airtime" orderNumber={orderNumber} />
      ) : method === 'ecocash' && orderNumber ? (
        <EcoCashPendingPoll kind="airtime" orderNumber={orderNumber} />
      ) : null}
    </SuccessShell>
  )
}
