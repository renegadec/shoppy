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
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    const take = 20
    const skip = (page - 1) * take

    const where = {
      ...(status !== 'all' ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { recipientMsisdn: { contains: search, mode: 'insensitive' } },
              { customer: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [total, orders] = await Promise.all([
      prisma.airtimeOrder.count({ where }),
      prisma.airtimeOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { customer: true },
      }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        pages: Math.max(1, Math.ceil(total / take)),
        total,
      },
    })
  } catch (e) {
    console.error('Airtime admin list error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
