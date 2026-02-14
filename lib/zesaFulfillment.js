import prisma from '@/lib/prisma'
import { hotRechargeProduct } from '@/lib/hotrecharge'
import { sendTelegramNotification } from '@/lib/telegram'

export async function fulfillZesaOrderIfPaid({ orderNumber }) {
  if (!orderNumber) throw new Error('orderNumber is required')

  const order = await prisma.zesaOrder.findUnique({
    where: { orderNumber },
    include: { customer: true },
  })

  if (!order) throw new Error('ZESA order not found')

  if (order.delivered) return order
  if (order.status !== 'PAID') return order

  const productId = order.hotProductId || 41

  try {
    const resp = await hotRechargeProduct({
      agentReference: order.orderNumber,
      productId,
      target: order.meterNumber,
      amount: order.tokenAmount,
      rechargeOptions: [
        {
          Name: 'NotifyNumber',
          ParameterType: 'string',
          Value: order.notifyNumber,
        },
      ],
    })

    const successful = !!resp?.successful

    await prisma.zesaOrder.update({
      where: { id: order.id },
      data: {
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
        ? `✅ <b>ZESA DELIVERED</b>\n\nOrder: ${order.orderNumber}\nMeter: ${order.meterNumber}\nToken amount: $${order.tokenAmount}\nHot rechargeId: ${resp?.rechargeId ?? 'N/A'}`
        : `❌ <b>ZESA DELIVERY FAILED</b>\n\nOrder: ${order.orderNumber}\nReason: ${resp?.message || 'Unknown error'}`
    )

    return await prisma.zesaOrder.findUnique({ where: { orderNumber } })
  } catch (e) {
    await prisma.zesaOrder.update({
      where: { id: order.id },
      data: {
        status: 'FAILED',
        deliveryNotes: `Hot recharge exception: ${e?.message || 'Unknown error'}`,
      },
    })

    await sendTelegramNotification(
      `❌ <b>ZESA DELIVERY ERROR</b>\n\nOrder: ${order.orderNumber}\nError: ${e?.message || 'Unknown error'}`
    )

    throw e
  }
}
