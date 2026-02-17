import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getOperation } from '@/lib/plisio'

function isPaid(order) {
  if (!order) return false
  if (order.status === 'PAID') return true
  const s = String(order.paymentStatus || '').toLowerCase()
  return ['completed', 'confirmed', 'finished', 'success', 'paid'].includes(s)
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const orderNumber = url.searchParams.get('order') || url.searchParams.get('orderNumber')
    if (!orderNumber) return NextResponse.json({ error: 'Missing order number' }, { status: 400 })

    // Locate the order across our order tables
    const [ticket, airtime, zesa, product] = await Promise.all([
      prisma.ticketOrder.findUnique({ where: { orderNumber }, select: { orderNumber: true, status: true, paymentMethod: true, paymentStatus: true, paymentId: true } }).catch(() => null),
      prisma.airtimeOrder.findUnique({ where: { orderNumber }, select: { orderNumber: true, status: true, paymentMethod: true, paymentStatus: true, paymentId: true } }).catch(() => null),
      prisma.zesaOrder.findUnique({ where: { orderNumber }, select: { orderNumber: true, status: true, paymentMethod: true, paymentStatus: true, paymentId: true } }).catch(() => null),
      prisma.order.findUnique({ where: { orderNumber }, select: { orderNumber: true, status: true, paymentMethod: true, paymentStatus: true, paymentId: true } }).catch(() => null),
    ])

    const order = ticket || airtime || zesa || product
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const paid = isPaid(order)

    // Best-effort: fetch invoice_url from Plisio using stored paymentId (txn_id)
    let invoiceUrl = null
    let providerStatus = null
    if (order.paymentMethod === 'crypto' && order.paymentId) {
      try {
        const opResp = await getOperation(String(order.paymentId))
        const op = opResp?.data || opResp?.operation || opResp?.response || opResp?.result || null
        providerStatus = op?.status || opResp?.status || null
        invoiceUrl = op?.invoice_url || op?.invoiceUrl || op?.invoiceUrl || null
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      paid,
      status: order.status,
      paymentStatus: order.paymentStatus || null,
      providerStatus,
      invoiceUrl,
    })
  } catch (e) {
    console.error('crypto status error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
