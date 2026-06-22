import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import SuccessShell from '@/components/SuccessShell'
import { ProductOrderSummary } from '@/components/OrderSummary'

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

  // Look up the order for summary display
  let order = null
  if (orderNumber) {
    try {
      order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { product: true },
      })
    } catch {
      // best-effort
    }
  }

  const productName = order?.product?.name || null

  const description = productName
    ? `Payment received for ${productName}. We'll deliver it to you shortly.`
    : 'Payment received. We\'ll deliver your product to you shortly.'

  return (
    <SuccessShell
      pending={false}
      description={description}
      backHref="/"
      backLabel="Back to Shop"
      steps={[
        'We verify payment and confirm your order',
        productName
          ? `We deliver ${productName} to your contact method (Telegram/WhatsApp/Email)`
          : 'We deliver your product via your preferred contact method',
        'You enjoy your purchase',
      ]}
    >
      {order ? <ProductOrderSummary order={order} /> : null}
    </SuccessShell>
  )
}
