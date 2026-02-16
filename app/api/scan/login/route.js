import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signScanToken } from '@/lib/scanAuth'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const eventSlug = String(body.eventSlug || '').trim()
    const username = String(body.username || '').trim()
    const pin = String(body.pin || '').trim()

    if (!eventSlug || !username || !pin) {
      return NextResponse.json({ error: 'eventSlug, username and pin are required' }, { status: 400 })
    }

    const event = await prisma.event.findUnique({ where: { slug: eventSlug } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const scanner = await prisma.eventScanner.findFirst({
      where: { eventId: event.id, username, active: true },
    })

    if (!scanner) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = await bcrypt.compare(pin, scanner.pinHash)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    await prisma.eventScanner.update({
      where: { id: scanner.id },
      data: { lastUsedAt: new Date() },
    })

    const token = signScanToken({
      kind: 'scanner',
      eventId: event.id,
      eventSlug: event.slug,
      scannerId: scanner.id,
      username: scanner.username,
    })

    return NextResponse.json({
      success: true,
      token,
      event: { id: event.id, slug: event.slug, title: event.title },
      scanner: { id: scanner.id, username: scanner.username },
    })
  } catch (e) {
    console.error('scan login error', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
