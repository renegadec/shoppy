import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import CryptoPendingPoll from '@/components/CryptoPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'ZESA Payment | Shoppy',
}

export default async function ZesaSuccessPage({ searchParams }) {
  const params = await searchParams
  const pending = params?.pending === '1' || params?.pending === 'true'
  const method = params?.method || ''
  const orderNumber = params?.order || ''

  const description = pending
    ? (method === 'ecocash'
        ? "We've sent a payment prompt to your phone. Please confirm the EcoCash payment to complete your ZESA order."
        : 'Your payment is being processed. Please wait for confirmation.')
    : 'Thanks! Once payment is confirmed, your ZESA token will be processed automatically.'

  return (
    <SuccessShell
      pending={pending}
      description={description}
      backHref="/zesa"
      backLabel="Back to ZESA"
      steps={[
        'We verify your payment',
        'We automatically process the ZESA token purchase',
        'ZETDC sends token notifications to the notify number',
      ]}
    >
      {pending && method === 'ecocash' && orderNumber && (
        <EcoCashPendingPoll kind="zesa" orderNumber={orderNumber} />
      )}

      {pending && method === 'crypto' && orderNumber && (
        <CryptoPendingPoll label="Crypto payment" orderNumber={orderNumber} />
      )}
    </SuccessShell>
  )
}
