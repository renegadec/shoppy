import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyScanToken } from '@/lib/scanAuth'

function extractTicketCode(input) {
  const s = String(input || '').trim()
  if (!s) return ''

  // Common patterns we might encode:
  // - shoppy://ticket/TCK-XXXX
  // - TCK-XXXX
  // - URL containing ticket code
  const direct = s.match(/(TCK-[A-Z0-9]+)/i)
  if (direct) return direct[1].toUpperCase()

  // last segment fallback
  const parts = s.split(/[\/\s]+/).filter(Boolean)
  return (parts[parts.length - 1] || '').toUpperCase()
}

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

    const claims = verifyScanToken(token)
    if (claims.kind !== 'scanner') return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const raw = String(body.code || body.qr || '').trim()
    const ticketCode = extractTicketCode(raw)
    if (!ticketCode) return NextResponse.json({ error: 'Missing ticket code' }, { status: 400 })

    // Find ticket item by code (preferred) OR by qrPayload if they scanned full payload.
    const item = await prisma.ticketItem.findFirst({
      where: {
        OR: [{ ticketCode }, { qrPayload: raw }],
        order: { eventId: claims.eventId },
      },
      include: {
        order: { include: { event: true, customer: true } },
        ticketType: true,
      },
    })

    if (!item) {
      await prisma.ticketScanLog.create({
        data: {
          eventId: claims.eventId,
          scannerId: claims.scannerId,
          ticketCode,
          result: 'INVALID',
          note: 'Not found for this event',
          meta: { raw },
        },
      })
      return NextResponse.json({ ok: false, result: 'INVALID', message: 'Ticket not found for this event' }, { status: 404 })
    }

    if (item.redeemed) {
      await prisma.ticketScanLog.create({
        data: {
          eventId: claims.eventId,
          scannerId: claims.scannerId,
          ticketItemId: item.id,
          ticketCode: item.ticketCode,
          result: 'ALREADY_USED',
          note: 'Ticket already redeemed',
          meta: { raw, redeemedAt: item.redeemedAt },
        },
      })
      return NextResponse.json({
        ok: true,
        result: 'ALREADY_USED',
        ticketCode: item.ticketCode,
        redeemedAt: item.redeemedAt,
        attendee: item.order?.customer?.name || item.order?.customer?.email || null,
        ticketType: item.ticketType?.name || null,
      })
    }

    const updated = await prisma.ticketItem.update({
      where: { id: item.id },
      data: { redeemed: true, redeemedAt: new Date() },
    })

    await prisma.ticketScanLog.create({
      data: {
        eventId: claims.eventId,
        scannerId: claims.scannerId,
        ticketItemId: item.id,
        ticketCode: item.ticketCode,
        result: 'VALID',
        meta: { raw },
      },
    })

    return NextResponse.json({
      ok: true,
      result: 'VALID',
      ticketCode: updated.ticketCode,
      redeemedAt: updated.redeemedAt,
      attendee: item.order?.customer?.name || item.order?.customer?.email || null,
      ticketType: item.ticketType?.name || null,
      eventTitle: item.order?.event?.title || null,
    })
  } catch (e) {
    console.error('scan redeem error', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
