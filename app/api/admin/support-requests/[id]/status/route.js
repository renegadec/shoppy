import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const ALLOWED = new Set(['OPEN', 'PENDING', 'RESOLVED'])

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const status = String(body.status || '').toUpperCase()

    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // If table isn't migrated yet, return warning.
    try {
      const updated = await prisma.supportRequest.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === 'RESOLVED' ? new Date() : null,
        },
      })

      return NextResponse.json({ success: true, item: updated })
    } catch (e) {
      const msg = String(e?.message || e)
      console.error('SupportRequest status update failed:', msg)
      return NextResponse.json(
        { error: 'SupportRequest table not available yet. Run prisma db push/migrations.' },
        { status: 500 }
      )
    }
  } catch (e) {
    console.error('SupportRequest status patch error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
