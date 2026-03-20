import prisma from '@/lib/prisma'

export const DEFAULT_PAYMENT_METHOD_SETTINGS = [
  { key: 'ecocash', enabled: true, note: null, sortOrder: 1 },
  { key: 'omari', enabled: true, note: null, sortOrder: 2 },
  { key: 'crypto', enabled: true, note: null, sortOrder: 3 },
  { key: 'card', enabled: false, note: 'Coming soon', sortOrder: 4 },
]

export async function ensurePaymentMethodDefaults() {
  // Create any missing rows (idempotent)
  await Promise.all(
    DEFAULT_PAYMENT_METHOD_SETTINGS.map((m) =>
      prisma.paymentMethodSetting.upsert({
        where: { key: m.key },
        create: m,
        update: {},
      })
    )
  )
}

export async function getPaymentMethodSettings() {
  await ensurePaymentMethodDefaults()
  const rows = await prisma.paymentMethodSetting.findMany({ orderBy: { sortOrder: 'asc' } })

  // Normalize for consumers
  return rows.map((r) => ({
    key: r.key,
    enabled: r.enabled,
    note: r.note,
    sortOrder: r.sortOrder,
  }))
}

export async function assertPaymentMethodEnabled(key) {
  await ensurePaymentMethodDefaults()
  const row = await prisma.paymentMethodSetting.findUnique({ where: { key } })
  if (!row) return { ok: false, note: 'Payment method not supported' }
  if (!row.enabled) return { ok: false, note: row.note || 'This payment method is temporarily unavailable' }
  return { ok: true, note: null }
}
