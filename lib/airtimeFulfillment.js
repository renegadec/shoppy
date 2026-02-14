import prisma from '@/lib/prisma'
import { hotRechargeProduct } from '@/lib/hotrecharge'
import { sendTelegramNotification } from '@/lib/telegram'
import { hotProductIdForNetwork } from '@/lib/airtime'

export async function fulfillAirtimeOrderIfPaid({ orderNumber }) {
  if (!orderNumber) throw new Error('orderNumber is required')

  const order = await prisma.airtimeOrder.findUnique({
    where: { orderNumber },
    include: { customer: true },
  })

  if (!order) throw new Error('Airtime order not found')

  // Idempotency guards
  if (order.delivered) return order
  if (order.status !== 'PAID') return order

  const productId = order.hotProductId ?? hotProductIdForNetwork(order.network)
  if (!productId) throw new Error(`No Hot productId mapped for network: ${order.network}`)

  try {
    const resp = await hotRechargeProduct({
      agentReference: order.orderNumber,
      productId,
      target: order.recipientMsisdn,
      amount: order.airtimeAmount,
      customsSMS: `You have received $%AMOUNT% airtime.`,
    })

    const successful = !!resp?.successful

    await prisma.airtimeOrder.update({
      where: { id: order.id },
      data: {
        hotProductId: productId,
        hotRechargeId: resp?.rechargeId ?? null,
        hotMessage: resp?.message ?? null,
        hotRaw: resp ?? null,
        status: successful ? 'DELIVERED' : 'FAILED',
        delivered: successful,
        deliveredAt: successful ? new Date() : null,
        deliveryNotes: successful
          ? `Hot recharge success. RechargeId=${resp?.rechargeId ?? 'N/A'}`
          : `Hot recharge failed: ${resp?.message || 'Unknown error'}`,
      },
    })

    await sendTelegramNotification(
      successful
        ? `✅ <b>AIRTIME DELIVERED</b>\n\nOrder: ${order.orderNumber}\nNetwork: ${String(order.network).toUpperCase()}\nRecipient: ${order.recipientMsisdn}\nAirtime: $${order.airtimeAmount}\nHot rechargeId: ${resp?.rechargeId ?? 'N/A'}`
        : `❌ <b>AIRTIME DELIVERY FAILED</b>\n\nOrder: ${order.orderNumber}\nReason: ${resp?.message || 'Unknown error'}`
    )

    return await prisma.airtimeOrder.findUnique({ where: { orderNumber } })
  } catch (e) {
    await prisma.airtimeOrder.update({
      where: { id: order.id },
      data: {
        status: 'FAILED',
        deliveryNotes: `Hot recharge exception: ${e?.message || 'Unknown error'}`,
      },
    })

    await sendTelegramNotification(
      `❌ <b>AIRTIME DELIVERY ERROR</b>\n\nOrder: ${order.orderNumber}\nError: ${e?.message || 'Unknown error'}`
    )

    throw e
  }
}
