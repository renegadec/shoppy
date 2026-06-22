import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import SuccessShell from '@/components/SuccessShell'
import { ZesaOrderSummary } from '@/components/OrderSummary'

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

  // Look up the order for summary display
  let order = null
  if (orderNumber) {
    try {
      order = await prisma.zesaOrder.findUnique({ where: { orderNumber } })
    } catch {
      // best-effort
    }
  }

  const description = order
    ? `Payment received. Your ZESA token of ${order.currency === 'ZWG' ? 'ZiG' : '$'}${Number(order.tokenAmount).toFixed(2)} for meter ${order.meterNumber} is being processed.`
    : 'Payment received. Your ZESA token is being processed.'

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
    >
      {order ? <ZesaOrderSummary order={order} /> : null}
    </SuccessShell>
  )
}
