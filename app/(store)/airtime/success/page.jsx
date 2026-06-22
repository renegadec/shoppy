import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import SuccessShell from '@/components/SuccessShell'
import { AirtimeOrderSummary } from '@/components/OrderSummary'

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

  // Look up the order for summary display
  let order = null
  if (orderNumber) {
    try {
      order = await prisma.airtimeOrder.findUnique({ where: { orderNumber } })
    } catch {
      // best-effort
    }
  }

  const networkLabel =
    {
      econet: 'Econet',
      netone: 'NetOne',
      telecel: 'Telecel',
    }[String(order?.network || '').toLowerCase()] || ''

  const description = order
    ? `Payment received. Your ${networkLabel} airtime of ${order.currency === 'ZWG' ? 'ZiG' : '$'}${Number(order.airtimeAmount).toFixed(2)} is on its way.`
    : 'Payment received. Your airtime is on its way.'

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
    >
      {order ? <AirtimeOrderSummary order={order} /> : null}
    </SuccessShell>
  )
}
