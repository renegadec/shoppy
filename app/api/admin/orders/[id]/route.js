import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET single order
export async function GET(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true
      }
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// UPDATE order (for marking delivered, adding notes, etc.)
export async function PUT(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    
    const updateData = {}
    
    if (data.status !== undefined) updateData.status = data.status
    if (data.delivered !== undefined) {
      updateData.delivered = data.delivered
      if (data.delivered) {
        updateData.deliveredAt = new Date()
        updateData.status = 'DELIVERED'
      }
    }
    if (data.deliveryNotes !== undefined) updateData.deliveryNotes = data.deliveryNotes
    
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        product: true
      }
    })
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
