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

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, scannerId } = await params
  const body = await request.json().catch(() => ({}))

  // Allow: { active: boolean } OR { resetPin: true, pin?: string }
  if (body.resetPin) {
    const pin = String(body.pin || randPin(6)).trim()
    if (!pin || pin.length < 4) return NextResponse.json({ error: 'pin must be at least 4 digits' }, { status: 400 })
    const pinHash = await bcrypt.hash(pin, 10)

    const updated = await prisma.eventScanner.update({
      where: { id: scannerId, eventId: id },
      data: { pinHash, active: true },
      select: { id: true, username: true, active: true, updatedAt: true },
    })

    return NextResponse.json({ success: true, item: updated, pin })
  }

  if (typeof body.active === 'boolean') {
    const updated = await prisma.eventScanner.update({
      where: { id: scannerId, eventId: id },
      data: { active: body.active },
      select: { id: true, username: true, active: true, updatedAt: true },
    })
    return NextResponse.json({ success: true, item: updated })
  }

  return NextResponse.json({ error: 'No valid patch provided' }, { status: 400 })
}
