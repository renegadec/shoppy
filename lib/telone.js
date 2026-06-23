import prisma from '@/lib/prisma'

export function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function computeMarkupAmount({ amount, markupRate = 0.01 }) {
  const base = Number(amount)
  const rate = Number(markupRate)
  return roundMoney(base * (1 + rate))
}

export async function generateTeloneOrderNumber() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `TELONE-${dateStr}-`

  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const todayCount = await prisma.teloneOrder.count({
    where: { createdAt: { gte: todayStart, lte: todayEnd } },
  })

  const sequence = String(todayCount + 1).padStart(3, '0')
  return `${prefix}${sequence}`
}
