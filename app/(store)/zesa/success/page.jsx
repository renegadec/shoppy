import { redirect } from 'next/navigation'
import SuccessShell from '@/components/SuccessShell'

export const metadata = {
  title: 'ZESA Payment | Shoppy',
}

export default async function ZesaSuccessPage({ searchParams }) {
  const params = await searchParams
  const pending = params?.pending === '1' || params?.pending === 'true'
  const method = params?.method || ''
  const orderNumber = params?.order || ''

  // Backwards-compat: if someone hits the old pending-on-success URL, send them to the dedicated pending page.
  if (pending) {
    redirect(`/zesa/pending?order=${encodeURIComponent(orderNumber)}&method=${encodeURIComponent(method)}`)
  }

  const description = 'Payment received. We’re processing your ZESA token now.'

  return (
    <SuccessShell
      pending={false}
      description={description}
      backHref="/zesa"
      backLabel="Back to ZESA"
      steps={[
        'We verify payment and confirm your order',
        'We automatically process the ZESA token purchase',
        'ZETDC sends token notifications to the notify number',
      ]}
    />
  )
}
