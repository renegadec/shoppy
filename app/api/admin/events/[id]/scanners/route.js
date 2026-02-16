import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function randPin(len = 6) {
  let s = ''
  for (let i = 0; i < len; i++) s += String(Math.floor(Math.random() * 10))
  return s
}

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const items = await prisma.eventScanner.findMany({
    where: { eventId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, active: true, lastUsedAt: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json({ items })
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const eventId = String(id || '').trim()
  if (!eventId || eventId === 'undefined' || eventId.length < 8) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, slug: true, title: true } })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const username = String(body.username || '').trim()
  const pin = String(body.pin || randPin(6)).trim()

  if (!username) return NextResponse.json({ error: 'username is required' }, { status: 400 })
  if (!pin || pin.length < 4) return NextResponse.json({ error: 'pin must be at least 4 digits' }, { status: 400 })

  const pinHash = await bcrypt.hash(pin, 10)

  const created = await prisma.eventScanner.create({
    data: {
      eventId: eventId,
      username,
      pinHash,
      active: true,
    },
    select: { id: true, username: true, active: true, createdAt: true },
  })

  // Return the PIN only on creation/reset.
  return NextResponse.json({ success: true, item: created, pin })
}
