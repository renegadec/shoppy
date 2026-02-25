import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DEFAULT_PRICING_SETTINGS, ensurePricingDefaults } from '@/lib/pricingSettings'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensurePricingDefaults()
  const settings = await prisma.pricingSetting.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ settings })
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const settings = body?.settings
  if (!Array.isArray(settings)) return NextResponse.json({ error: 'settings must be an array' }, { status: 400 })

  const allowedKeys = new Set(DEFAULT_PRICING_SETTINGS.map((s) => s.key))

  await ensurePricingDefaults()

  await prisma.$transaction(
    settings
      .filter((s) => allowedKeys.has(s?.key))
      .map((s) =>
        prisma.pricingSetting.update({
          where: { key: s.key },
          data: {
            value: Number(s.value),
            note: s.note != null ? String(s.note) : undefined,
          },
        })
      )
  )

  const updated = await prisma.pricingSetting.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ success: true, settings: updated })
}
