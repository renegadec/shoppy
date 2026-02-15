import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/orders'

export function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function computeMarkupAmount({ airtimeAmount, markupRate = 0.02 }) {
  const base = Number(airtimeAmount)
  const rate = Number(markupRate)
  const toPay = base * (1 + rate)
  return roundMoney(toPay)
}

export function hotProductIdForNetwork(network) {
  const n = String(network || '').toLowerCase()
  // Hot Recharge product IDs (USD airtime):
  // Econet: 101, NetOne USD Airtime (102) requires a ProductCode option (denomination)
  // which we aren't selecting yet. Use generic "Airtime USD" (100) for NetOne for now.
  // Telecel: 103
  if (n === 'econet') return 101
  if (n === 'netone') return 100
  if (n === 'telecel') return 103
  return null
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
