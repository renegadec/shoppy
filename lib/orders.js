import prisma from './prisma'

/**
 * Generate a human-readable order number
 * Format: SHP-YYYYMMDD-XXX (e.g., SHP-20260203-001)
 */
export async function generateOrderNumber() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `SHP-${dateStr}-`
  
  // Find today's orders to get the next sequence number
  const todayStart = new Date(today.setHours(0, 0, 0, 0))
  const todayEnd = new Date(today.setHours(23, 59, 59, 999))
  
  const todayOrderCount = await prisma.order.count({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  })
  
  const sequence = String(todayOrderCount + 1).padStart(3, '0')
  return `${prefix}${sequence}`
}

/**
 * Create a new order
 */
export async function createOrder({
  email,
  productId,
  amount,
  contactMethod,
  contactValue,
  paymentId,
  customerName,
  phone,
  telegram,
  whatsapp
}) {
  // Find or create customer
  let customer = await prisma.customer.findUnique({
    where: { email }
  })
  
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email,
        name: customerName,
        phone,
        telegram,
        whatsapp
      }
    })
  } else {
    // Update customer info if provided
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customerName || customer.name,
        phone: phone || customer.phone,
        telegram: telegram || customer.telegram,
        whatsapp: whatsapp || customer.whatsapp
      }
    })
  }
  
  const orderNumber = await generateOrderNumber()
  
  const order = await prisma.order.create({
    data: {
      orderNumber,
      amount,
      contactMethod,
      contactValue,
      paymentId,
      customerId: customer.id,
      productId
    },
    include: {
      customer: true,
      product: true
    }
  })
  
  return order
}

/**
 * Update order status from payment webhook
 */
export async function updateOrderFromWebhook({
  paymentId,
  orderNumber,
  status,
  paidAmount,
  paidCurrency
}) {
  const statusMap = {
    'waiting': 'PENDING',
    'confirming': 'PROCESSING',
    'confirmed': 'PAID',
    'sending': 'PROCESSING',
    'partially_paid': 'PARTIALLY_PAID',
    'finished': 'PAID',
    'failed': 'FAILED',
    'refunded': 'REFUNDED',
    'expired': 'EXPIRED'
  }
  
  const orderStatus = statusMap[status] || 'PENDING'
  const isPaid = ['confirmed', 'finished'].includes(status)
  
  const updateData = {
    status: orderStatus,
    paymentStatus: status,
    paidAmount,
    paidCurrency,
    ...(isPaid && { paidAt: new Date() })
  }
  
  // Try to find by paymentId first, then by orderNumber
  let order
  
  if (paymentId) {
    order = await prisma.order.findFirst({
      where: { paymentId }
    })
  }
  
  if (!order && orderNumber) {
    order = await prisma.order.findUnique({
      where: { orderNumber }
    })
  }
  
  if (!order) {
    console.error('Order not found for webhook update:', { paymentId, orderNumber })
    return null
  }
  
  return await prisma.order.update({
    where: { id: order.id },
    data: updateData,
    include: {
      customer: true,
      product: true
    }
  })
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  
  const [
    totalOrders,
    totalRevenue,
    monthlyOrders,
    monthlyRevenue,
    lastMonthRevenue,
    pendingOrders,
    totalCustomers,
    recentOrders
  ] = await Promise.all([
    // Total orders
    prisma.order.count(),
    
    // Total revenue (paid orders only)
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' }
    }),
    
    // This month's orders
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth } }
    }),
    
    // This month's revenue
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'PAID',
        createdAt: { gte: startOfMonth }
      }
    }),
    
    // Last month's revenue
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'PAID',
        createdAt: { 
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    }),
    
    // Pending orders
    prisma.order.count({
      where: { status: 'PENDING' }
    }),
    
    // Total customers
    prisma.customer.count(),
    
    // Recent orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        product: true
      }
    })
  ])
  
  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.amount || 0,
    monthlyOrders,
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
    lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
    pendingOrders,
    totalCustomers,
    recentOrders
  }
}
