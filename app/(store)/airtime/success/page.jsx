import { redirect } from 'next/navigation'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'Airtime Payment | Shoppy',
}

export default async function AirtimeSuccessPage({ searchParams }) {
  const params = await searchParams
  const pending = params?.pending === '1' || params?.pending === 'true'
  const method = params?.method || ''
  const orderNumber = params?.order || ''

  // Backwards-compat: if someone hits the old pending-on-success URL, send them to the dedicated pending page.
  if (pending) {
    redirect(`/airtime/pending?order=${encodeURIComponent(orderNumber)}&method=${encodeURIComponent(method)}`)
  }

  const description = 'Payment received. We’re processing your airtime top up now.'

  return (
    <SuccessShell
      pending={false}
      description={description}
      backHref="/airtime"
      backLabel="Back to Airtime"
      steps={[
        'We verify payment and confirm your order',
        'We automatically deliver airtime to the recipient number',
        'We send you confirmation via your chosen contact method',
      ]}
    />
  )
}
