import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram'

function safeStr(v) {
  return String(v ?? '').trim()
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    // Basic anti-spam honeypot
    if (safeStr(body.website)) {
      return NextResponse.json({ success: true, reference: 'spam-ignored' })
    }

    const kind = safeStr(body.kind) || 'support'
    const email = safeStr(body.email)
    const message = safeStr(body.message)

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    if (kind === 'event_listing') {
      if (!safeStr(body.eventName)) return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
      if (!safeStr(body.eventDate)) return NextResponse.json({ error: 'Event date/time is required' }, { status: 400 })
      if (!safeStr(body.organiserContact)) return NextResponse.json({ error: 'Organiser contact is required' }, { status: 400 })
    }

    let ref = null

    // Persist in DB when available. If the table isn't migrated yet, still notify support via Telegram.
    try {
      const created = await prisma.supportRequest.create({
        data: {
          kind,
          name: safeStr(body.name) || null,
          email,
          phone: safeStr(body.phone) || null,
          orderNumber: safeStr(body.orderNumber) || null,
          eventName: safeStr(body.eventName) || null,
          eventDate: safeStr(body.eventDate) || null,
          eventCity: safeStr(body.eventCity) || null,
          eventVenue: safeStr(body.eventVenue) || null,
          ticketInfo: safeStr(body.ticketInfo) || null,
          organiserContact: safeStr(body.organiserContact) || null,
          message,
          meta: {
            ua: request.headers.get('user-agent') || null,
            ip: request.headers.get('x-forwarded-for') || null,
          },
        },
      })
      ref = created.id
    } catch (e) {
      console.error('SupportRequest DB write failed (continuing):', e?.message || e)
      ref = `tmp_${Date.now().toString(36)}`
    }

    // Notify Telegram (best-effort)
    try {
      const lines = [
        `📩 <b>NEW CONTACT</b> (${kind})`,
        `Ref: <code>${ref}</code>`,
        `Email: ${email}`,
        body.phone ? `Phone: ${safeStr(body.phone)}` : null,
        body.orderNumber ? `Order: <code>${safeStr(body.orderNumber)}</code>` : null,
        body.eventName ? `Event: ${safeStr(body.eventName)} (${safeStr(body.eventDate)})` : null,
        body.organiserContact ? `Organiser: ${safeStr(body.organiserContact)}` : null,
        '',
        safeStr(message).slice(0, 900),
      ].filter(Boolean)

      await sendTelegramNotification(lines.join('\n'))
    } catch (e) {
      console.error('Telegram notify failed:', e)
    }

    return NextResponse.json({ success: true, reference: ref })
  } catch (e) {
    console.error('Contact form error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
