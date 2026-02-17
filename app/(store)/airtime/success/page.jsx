import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'Airtime Payment | Shoppy',
}

export default async function AirtimeSuccessPage({ searchParams }) {
  const params = await searchParams
  const pending = params?.pending === '1' || params?.pending === 'true'
  const method = params?.method || ''
  const orderNumber = params?.order || ''

  const description = pending
    ? (method === 'ecocash'
        ? "We've sent a payment prompt to your phone. Please confirm the EcoCash payment to complete your airtime order."
        : 'Your payment is being processed. Please wait for confirmation.')
    : 'Thanks! Once payment is confirmed, your airtime will be delivered automatically.'

  return (
    <SuccessShell
      pending={pending}
      description={description}
      backHref="/airtime"
      backLabel="Back to Airtime"
      steps={[
        'We verify your payment',
        'We automatically deliver airtime to the recipient number',
        'We send you confirmation via your chosen contact method',
      ]}
    >
      {pending && method === 'ecocash' && orderNumber && (
        <EcoCashPendingPoll kind="airtime" orderNumber={orderNumber} />
      )}

      {/* Crypto payments complete on Plisio and return via the "Return to merchant" button. */}
    </SuccessShell>
  )
}
