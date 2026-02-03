import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET single product
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { customer: true }
        }
      }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// UPDATE product
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        highlights: data.highlights,
        tagline: data.tagline,
        price: parseFloat(data.price),
        period: data.period,
        image: data.image,
        features: data.features,
        popular: data.popular,
        active: data.active
      }
    })
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE product
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Check if product has orders
    const orderCount = await prisma.order.count({
      where: { productId: params.id }
    })
    
    if (orderCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.product.update({
        where: { id: params.id },
        data: { active: false }
      })
      return NextResponse.json({ message: 'Product deactivated (has orders)' })
    }
    
    // Hard delete if no orders
    await prisma.product.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
