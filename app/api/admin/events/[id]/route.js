import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id },
    include: { ticketTypes: { orderBy: { sortOrder: 'asc' } } },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(event)
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await request.json()

  const startsAt = data.startsAt ? new Date(data.startsAt) : null
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'startsAt is required' }, { status: 400 })
  }

  // Simplest approach: replace ticket types (deleteMany + createMany)
  // Later: diff/update in-place.
  await prisma.eventTicketType.deleteMany({ where: { eventId: id } })

  const event = await prisma.event.update({
    where: { id },
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
    include: { ticketTypes: { orderBy: { sortOrder: 'asc' } } },
  })

  return NextResponse.json(event)
}

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // soft delete
  const event = await prisma.event.update({
    where: { id },
    data: { active: false, published: false },
  })

  return NextResponse.json({ success: true, event })
}
