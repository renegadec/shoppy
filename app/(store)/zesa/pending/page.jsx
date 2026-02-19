import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'ZESA Payment Pending | Shoppy',
}

export default async function ZesaPendingPage({ searchParams }) {
  const sp = await searchParams
  const method = sp?.method || ''
  const orderNumber = sp?.order || ''

  const description = method === 'ecocash'
    ? "We've sent a payment prompt to your phone. Please confirm the EcoCash payment, then refresh the status below to complete your ZESA order."
    : 'Your payment is being processed. Please wait for confirmation.'

  return (
    <SuccessShell
      pending
      description={description}
      backHref="/zesa"
      backLabel="Back to ZESA"
      steps={[
        'Confirm the payment on your phone',
        'Refresh status to confirm payment',
        'We automatically process the ZESA token purchase',
      ]}
    >
      {method === 'ecocash' && orderNumber ? (
        <EcoCashPendingPoll kind="zesa" orderNumber={orderNumber} />
      ) : null}
    </SuccessShell>
  )
}
