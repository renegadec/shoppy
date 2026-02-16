import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '')
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replaceAll('"', '""')}"`
    return s
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const format = (searchParams.get('format') || 'json').toLowerCase()

  const event = await prisma.event.findUnique({
    where: { id },
    include: { ticketTypes: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const paidOrders = await prisma.ticketOrder.findMany({
    where: { eventId: id, status: 'PAID' },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })

  const ticketItems = await prisma.ticketItem.findMany({
    where: {
      order: { eventId: id, status: 'PAID' },
    },
    include: { ticketType: true, order: true },
  })

  const totals = {
    eventId: event.id,
    eventTitle: event.title,
    currency: 'USD',
    paidOrders: paidOrders.length,
    ticketsSold: ticketItems.length,
    revenue: paidOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
  }

  const byType = {}
  for (const t of event.ticketTypes || []) {
    byType[t.id] = {
      ticketTypeId: t.id,
      name: t.name,
      price: Number(t.price || 0),
      sold: 0,
      revenue: 0,
      capacity: t.capacity ?? null,
    }
  }

  for (const it of ticketItems) {
    const bucket = byType[it.ticketTypeId] || (byType[it.ticketTypeId] = {
      ticketTypeId: it.ticketTypeId,
      name: it.ticketType?.name || 'Ticket',
      price: Number(it.ticketType?.price || 0),
      sold: 0,
      revenue: 0,
      capacity: it.ticketType?.capacity ?? null,
    })
    bucket.sold += 1
    bucket.revenue += bucket.price
  }

  const breakdown = Object.values(byType).map((b) => ({
    ...b,
    remaining: b.capacity == null ? null : Math.max(0, b.capacity - b.sold),
  }))

  if (format === 'csv') {
    const header = ['orderNumber', 'createdAt', 'customerEmail', 'amount', 'paymentMethod', 'paymentStatus', 'delivered']
    const rows = paidOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.customer?.email || '',
      Number(o.amount || 0).toFixed(2),
      o.paymentMethod || '',
      o.paymentStatus || '',
      o.delivered ? 'yes' : 'no',
    ])

    const csv = toCsv([header, ...rows])
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${event.slug || event.id}-sales.csv"`,
      },
    })
  }

  return NextResponse.json({ totals, breakdown, orders: paidOrders.slice(0, 50) })
}
