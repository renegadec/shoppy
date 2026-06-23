import prisma from '@/lib/prisma'
import { hotRechargeProduct } from '@/lib/hotrecharge'
import { sendTelegramNotification } from '@/lib/telegram'

const HOT_TELONE_BROADBAND_PRODUCT_ID = 31

export async function fulfillTeloneOrderIfPaid({ orderNumber }) {
  if (!orderNumber) throw new Error('orderNumber is required')

  const order = await prisma.teloneOrder.findUnique({
    where: { orderNumber },
    include: { customer: true },
  })

  if (!order) throw new Error('Telone order not found')

  if (order.delivered) return order
  if (order.status !== 'PAID') return order

  const productId = order.hotProductId || HOT_TELONE_BROADBAND_PRODUCT_ID

  try {
    const resp = await hotRechargeProduct({
      agentReference: order.orderNumber,
      productId,
      target: order.target,
      amount: order.amount,
      rechargeOptions: [
        {
          Name: 'ProductCode',
          ParameterType: 'int',
          Value: String(order.bundleProductCode),
        },
        {
          Name: 'NotifyNumber',
          ParameterType: 'string',
          Value: order.notifyNumber,
        },
      ],
    })

    const successful = !!resp?.successful

    await prisma.teloneOrder.update({
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
        ? `📡 <b>TELONE BROADBAND DELIVERED</b>\n\nOrder: ${order.orderNumber}\nTarget: ${order.target}\nBundle: ${order.bundleName || order.bundleProductCode}\nAmount: $${order.amount}\nHot rechargeId: ${resp?.rechargeId ?? 'N/A'}`
        : `❌ <b>TELONE BROADBAND DELIVERY FAILED</b>\n\nOrder: ${order.orderNumber}\nReason: ${resp?.message || 'Unknown error'}`
    )

    return await prisma.teloneOrder.findUnique({ where: { orderNumber } })
  } catch (e) {
    await prisma.teloneOrder.update({
      where: { id: order.id },
      data: {
        status: 'FAILED',
        deliveryNotes: `Hot recharge exception: ${e?.message || 'Unknown error'}`,
      },
    })

    await sendTelegramNotification(
      `❌ <b>TELONE BROADBAND DELIVERY ERROR</b>\n\nOrder: ${order.orderNumber}\nError: ${e?.message || 'Unknown error'}`
    )

    throw e
  }
}
