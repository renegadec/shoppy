import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DEFAULT_PAYMENT_METHOD_SETTINGS, ensurePaymentMethodDefaults } from '@/lib/paymentMethods'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensurePaymentMethodDefaults()
  const methods = await prisma.paymentMethodSetting.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ methods })
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const methods = body?.methods
  if (!Array.isArray(methods)) return NextResponse.json({ error: 'methods must be an array' }, { status: 400 })

  const allowedKeys = new Set(DEFAULT_PAYMENT_METHOD_SETTINGS.map((m) => m.key))

  await ensurePaymentMethodDefaults()

  await prisma.$transaction(
    methods
      .filter((m) => allowedKeys.has(m?.key))
      .map((m) =>
        prisma.paymentMethodSetting.update({
          where: { key: m.key },
          data: {
            enabled: Boolean(m.enabled),
            note: m.note ? String(m.note) : null,
            sortOrder: m.sortOrder != null ? Number(m.sortOrder) : undefined,
          },
        })
      )
  )

  const updated = await prisma.paymentMethodSetting.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ success: true, methods: updated })
}
