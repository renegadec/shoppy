import { redirect } from 'next/navigation'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'Payment Successful | Shoppy',
}

export default async function SuccessPage({ searchParams }) {
  const params = await searchParams
  const pending = params?.pending === '1' || params?.pending === 'true'
  const method = params?.method || ''
  const orderNumber = params?.order || ''

  // Backwards-compat: if someone hits the old pending-on-success URL, send them to the dedicated pending page.
  if (pending) {
    redirect(`/pending?order=${encodeURIComponent(orderNumber)}&method=${encodeURIComponent(method)}`)
  }

  const description = "Payment received. We’ll contact you shortly to deliver your product and help with setup."

  return (
    <SuccessShell
      pending={false}
      description={description}
      backHref="/"
      backLabel="Back to Shop"
      steps={[
        'We verify payment and confirm your order',
        'We contact you via your preferred method (Telegram/WhatsApp/Email)',
        'We deliver your product and help you set it up',
      ]}
    />
  )
}
