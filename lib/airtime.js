import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/orders'
import { hotProductId } from '@/lib/currencies'

export function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function computeMarkupAmount({ airtimeAmount, markupRate = 0.02 }) {
  const base = Number(airtimeAmount)
  const rate = Number(markupRate)
  const toPay = base * (1 + rate)
  return roundMoney(toPay)
}

/**
 * Legacy function — kept for backward compat.
 * Returns USD airtime product IDs only.
 * Use hotProductId(network, currency) from lib/currencies for multi-currency.
 */
export function hotProductIdForNetwork(network) {
  return hotProductId(network, 'USD')
}

export async function generateAirtimeOrderNumber() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `AIR-${dateStr}-`

  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const todayCount = await prisma.airtimeOrder.count({
    where: { createdAt: { gte: todayStart, lte: todayEnd } },
  })

  const sequence = String(todayCount + 1).padStart(3, '0')
  return `${prefix}${sequence}`
}
