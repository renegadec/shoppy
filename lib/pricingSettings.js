import prisma from '@/lib/prisma'

export const DEFAULT_PRICING_SETTINGS = [
  {
    key: 'airtime_markup_rate',
    value: 0.02,
    note: 'Markup rate added on top of airtime face value (e.g. 0.02 = 2%)',
  },
  // Keeping for future use; not yet wired unless you want it.
  // { key: 'zesa_markup_rate', value: 0.01, note: 'Markup rate added on top of ZESA token amount' },
]

export async function ensurePricingDefaults() {
  await Promise.all(
    DEFAULT_PRICING_SETTINGS.map(async (s) => {
      await prisma.pricingSetting.upsert({
        where: { key: s.key },
        update: {},
        create: { key: s.key, value: s.value, note: s.note || null },
      })
    })
  )
}

export async function getPricingSettingFloat(key, fallback) {
  const row = await prisma.pricingSetting.findUnique({ where: { key } })
  if (!row) return fallback
  const v = Number(row.value)
  return Number.isFinite(v) ? v : fallback
}
