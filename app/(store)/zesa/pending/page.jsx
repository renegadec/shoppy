import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import OmariPendingPoll from '@/components/OmariPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'ZESA Payment Pending | Shoppy',
}

export default async function ZesaPendingPage({ searchParams }) {
  const sp = await searchParams
  const method = sp?.method || ''
  const orderNumber = sp?.order || ''

  const description = method === 'omari'
    ? "We've started your Omari payment. Enter the OTP below to complete your ZESA order."
    : method === 'ecocash'
      ? "We've sent a payment prompt to your phone. Approve it to complete your ZESA order."
      : 'Your payment is being processed. Please wait for confirmation.'

  return (
    <SuccessShell
      pending
      description={description}
      backHref="/zesa"
      backLabel="Back to ZESA"
      steps={[
        'Confirm the payment on your phone',
        'We automatically check for confirmation',
        'We process the ZESA token purchase',
      ]}
    >
      {method === 'omari' && orderNumber ? (
        <OmariPendingPoll kind="zesa" orderNumber={orderNumber} />
      ) : method === 'ecocash' && orderNumber ? (
        <EcoCashPendingPoll kind="zesa" orderNumber={orderNumber} />
      ) : null}
    </SuccessShell>
  )
}
