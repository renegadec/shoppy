import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendTicketEmail } from '@/lib/email'

export async function POST(_request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const order = await prisma.ticketOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      event: true,
      items: { include: { ticketType: true } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    await sendTicketEmail({ order, baseUrl })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Resend ticket email failed:', e)
    return NextResponse.json({ error: e?.message || 'Failed to resend' }, { status: 500 })
  }
}
