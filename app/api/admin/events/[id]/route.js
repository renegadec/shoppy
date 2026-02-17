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

  // NOTE: We cannot blindly delete+recreate ticket types on edit because ticket types
  // may already be referenced by TicketItem rows (FK constraint). Instead we:
  // - update existing types by id
  // - create new types
  // - for removed types: delete if unused, otherwise deactivate

  const incoming = (data.ticketTypes || [])
    .filter((t) => t?.name && t?.price !== '' && t?.price != null)
    .map((t, idx) => ({
      id: t.id || null,
      name: t.name,
      price: Number(t.price),
      currency: t.currency || 'USD',
      capacity: t.capacity ? Number(t.capacity) : null,
      active: t.active !== false,
      sortOrder: t.sortOrder != null ? Number(t.sortOrder) : idx,
    }))

  const endsAt = data.endsAt ? new Date(data.endsAt) : null
  const safeEndsAt = endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null

  const event = await prisma.$transaction(async (tx) => {
    const existing = await tx.eventTicketType.findMany({
      where: { eventId: id },
      select: {
        id: true,
        _count: { select: { ticketItems: true } },
      },
    })

    const existingIds = new Set(existing.map((t) => t.id))
    const incomingIds = new Set(incoming.map((t) => t.id).filter(Boolean))

    const toRemove = existing.filter((t) => !incomingIds.has(t.id))
    const toUpdate = incoming.filter((t) => t.id && existingIds.has(t.id))
    const toCreate = incoming.filter((t) => !t.id)

    // Update the event itself
    await tx.event.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle || null,
        description: data.description || null,
        venue: data.venue || null,
        city: data.city || null,
        startsAt,
        endsAt: safeEndsAt,
        organizerName: data.organizerName || null,
        organizerRef: data.organizerRef || null,
        image: data.image || null,
        category: data.category || null,
        published: Boolean(data.published),
        active: data.active !== false,
      },
    })

    // Apply ticket type changes
    await Promise.all(
      toUpdate.map((t) =>
        tx.eventTicketType.update({
          where: { id: t.id },
          data: {
            name: t.name,
            price: t.price,
            currency: t.currency,
            capacity: t.capacity,
            active: t.active,
            sortOrder: t.sortOrder,
          },
        })
      )
    )

    if (toCreate.length) {
      await tx.eventTicketType.createMany({
        data: toCreate.map((t) => ({
          eventId: id,
          name: t.name,
          price: t.price,
          currency: t.currency,
          capacity: t.capacity,
          active: t.active,
          sortOrder: t.sortOrder,
        })),
      })
    }

    await Promise.all(
      toRemove.map((t) =>
        t._count.ticketItems > 0
          ? tx.eventTicketType.update({ where: { id: t.id }, data: { active: false } })
          : tx.eventTicketType.delete({ where: { id: t.id } })
      )
    )

    return tx.event.findUnique({
      where: { id },
      include: { ticketTypes: { orderBy: { sortOrder: 'asc' } } },
    })
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
