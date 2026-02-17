import EcoCashPendingPoll from '@/components/EcoCashPendingPoll'
import CryptoPendingPoll from '@/components/CryptoPendingPoll'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'Payment Successful | Shoppy',
}

export default async function SuccessPage({ searchParams }) {
  const params = await searchParams
  const pending = params?.pending === '1' || params?.pending === 'true'
  const method = params?.method || ''
  const orderNumber = params?.order || ''

  const description = pending
    ? (method === 'ecocash'
        ? "We've sent a payment prompt to your phone. Please confirm the EcoCash payment to complete your order."
        : 'Your payment is being processed. Please wait for confirmation.')
    : "Thank you for your purchase! We've received your payment and will contact you shortly to deliver your product and help with setup."

  return (
    <SuccessShell
      pending={pending}
      description={description}
      backHref="/"
      backLabel="Back to Shop"
      steps={[
        `We’ll verify your payment${pending ? ' (this can take a moment after you confirm on your phone)' : ' (usually within a few minutes)'}`,
        'We’ll contact you via your preferred method (Telegram/WhatsApp/Email)',
        "We’ll deliver your product and help you set it up",
      ]}
    >
      {pending && method === 'ecocash' && orderNumber && (
        <EcoCashPendingPoll kind="product" orderNumber={orderNumber} />
      )}

      {pending && method === 'crypto' && orderNumber && (
        <CryptoPendingPoll label="Crypto payment" orderNumber={orderNumber} />
      )}
    </SuccessShell>
  )
}
