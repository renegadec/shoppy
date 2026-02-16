import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const kind = searchParams.get('kind') || 'all'
    const q = (searchParams.get('q') || '').trim()

    const take = 20
    const skip = (page - 1) * take

    const where = {
      ...(kind !== 'all' ? { kind } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { orderNumber: { contains: q, mode: 'insensitive' } },
              { eventName: { contains: q, mode: 'insensitive' } },
              { organiserContact: { contains: q, mode: 'insensitive' } },
              { message: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    // If table isn't migrated yet, return empty but don't fail admin.
    try {
      const [total, items] = await Promise.all([
        prisma.supportRequest.count({ where }),
        prisma.supportRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
      ])

      return NextResponse.json({
        items,
        pagination: {
          page,
          pages: Math.max(1, Math.ceil(total / take)),
          total,
        },
      })
    } catch (e) {
      const msg = String(e?.message || e)
      console.error('SupportRequest admin query failed:', msg)
      return NextResponse.json({
        items: [],
        pagination: { page: 1, pages: 1, total: 0 },
        warning: 'SupportRequest table not available yet. Run prisma db push/migrations.',
      })
    }
  } catch (e) {
    console.error('SupportRequest admin list error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
