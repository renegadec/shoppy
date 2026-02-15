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
              { meterNumber: { contains: search, mode: 'insensitive' } },
              { notifyNumber: { contains: search, mode: 'insensitive' } },
              { customer: { email: { contains: search, mode: 'insensitive' } } },
              { paymentId: { contains: search, mode: 'insensitive' } },
              { providerRef: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [total, orders] = await Promise.all([
      prisma.zesaOrder.count({ where }),
      prisma.zesaOrder.findMany({
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
    console.error('ZESA admin list error:', e)
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
