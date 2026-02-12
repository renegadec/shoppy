import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const events = await prisma.event.findMany({
    orderBy: { startsAt: 'desc' },
    include: { ticketTypes: true },
  })

  return NextResponse.json(events)
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()

  const startsAt = data.startsAt ? new Date(data.startsAt) : null
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'startsAt is required' }, { status: 400 })
  }

  const event = await prisma.event.create({
    data: {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description || null,
      venue: data.venue || null,
      city: data.city || null,
      startsAt,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      organizerName: data.organizerName || null,
      organizerRef: data.organizerRef || null,
      image: data.image || null,
      category: data.category || null,
      published: Boolean(data.published),
      active: data.active !== false,
      ticketTypes: {
        create: (data.ticketTypes || [])
          .filter((t) => t?.name && t?.price !== '' && t?.price != null)
          .map((t, idx) => ({
            name: t.name,
            price: Number(t.price),
            currency: t.currency || 'USD',
            capacity: t.capacity ? Number(t.capacity) : null,
            active: t.active !== false,
            sortOrder: t.sortOrder != null ? Number(t.sortOrder) : idx,
          })),
      },
    },
    include: { ticketTypes: true },
  })

  return NextResponse.json(event)
}
