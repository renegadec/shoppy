import prisma from './prisma'

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfLastMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

function endOfLastMonth(d = new Date()) {
  // Day 0 of this month = last day of previous month
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999)
}

function normalizeRow(type, row) {
  return {
    type,
    id: row.id,
    orderNumber: row.orderNumber,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    delivered: Boolean(row.delivered),
    createdAt: row.createdAt,
    // context labels
    customerEmail: row.customer?.email || null,
    customerName: row.customer?.name || null,
    label:
      type === 'product'
        ? row.product?.name || 'Product'
        : type === 'airtime'
          ? `${String(row.network || '').toUpperCase()} • ${row.recipientMsisdn || ''}`.trim()
          : type === 'zesa'
            ? `Meter ${row.meterNumber || ''}`.trim()
            : type === 'ticket'
              ? row.event?.title || 'Event'
              : type,
  }
}

export async function getDashboardStatsAll() {
  const now = new Date()
  const som = startOfMonth(now)
  const solm = startOfLastMonth(now)
  const eolm = endOfLastMonth(now)

  const paidWhereAllTime = { status: 'PAID' }
  const paidWhereMonth = { status: 'PAID', createdAt: { gte: som } }
  const paidWhereLastMonth = { status: 'PAID', createdAt: { gte: solm, lte: eolm } }

  const pendingWhere = { status: 'PENDING' }

  const [
    productOrdersCount,
    airtimeOrdersCount,
    zesaOrdersCount,
    ticketOrdersCount,

    productRevenue,
    airtimeRevenue,
    zesaRevenue,
    ticketRevenue,

    productMonthlyRevenue,
    airtimeMonthlyRevenue,
    zesaMonthlyRevenue,
    ticketMonthlyRevenue,

    productLastMonthRevenue,
    airtimeLastMonthRevenue,
    zesaLastMonthRevenue,
    ticketLastMonthRevenue,

    productPending,
    airtimePending,
    zesaPending,
    ticketPending,

    totalCustomers,

    recentProduct,
    recentAirtime,
    recentZesa,
    recentTickets,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.airtimeOrder.count(),
    prisma.zesaOrder.count(),
    prisma.ticketOrder.count(),

    prisma.order.aggregate({ _sum: { amount: true }, where: paidWhereAllTime }),
    prisma.airtimeOrder.aggregate({ _sum: { amount: true }, where: paidWhereAllTime }),
    prisma.zesaOrder.aggregate({ _sum: { amount: true }, where: paidWhereAllTime }),
    prisma.ticketOrder.aggregate({ _sum: { amount: true }, where: paidWhereAllTime }),

    prisma.order.aggregate({ _sum: { amount: true }, where: paidWhereMonth }),
    prisma.airtimeOrder.aggregate({ _sum: { amount: true }, where: paidWhereMonth }),
    prisma.zesaOrder.aggregate({ _sum: { amount: true }, where: paidWhereMonth }),
    prisma.ticketOrder.aggregate({ _sum: { amount: true }, where: paidWhereMonth }),

    prisma.order.aggregate({ _sum: { amount: true }, where: paidWhereLastMonth }),
    prisma.airtimeOrder.aggregate({ _sum: { amount: true }, where: paidWhereLastMonth }),
    prisma.zesaOrder.aggregate({ _sum: { amount: true }, where: paidWhereLastMonth }),
    prisma.ticketOrder.aggregate({ _sum: { amount: true }, where: paidWhereLastMonth }),

    prisma.order.count({ where: pendingWhere }),
    prisma.airtimeOrder.count({ where: pendingWhere }),
    prisma.zesaOrder.count({ where: pendingWhere }),
    prisma.ticketOrder.count({ where: pendingWhere }),

    prisma.customer.count(),

    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, product: true },
    }),
    prisma.airtimeOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.zesaOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.ticketOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, event: true },
    }),
  ])

  const totalOrders = productOrdersCount + airtimeOrdersCount + zesaOrdersCount + ticketOrdersCount
  const pendingOrders = productPending + airtimePending + zesaPending + ticketPending

  const totalRevenue =
    (productRevenue._sum.amount || 0) +
    (airtimeRevenue._sum.amount || 0) +
    (zesaRevenue._sum.amount || 0) +
    (ticketRevenue._sum.amount || 0)

  const monthlyRevenue =
    (productMonthlyRevenue._sum.amount || 0) +
    (airtimeMonthlyRevenue._sum.amount || 0) +
    (zesaMonthlyRevenue._sum.amount || 0) +
    (ticketMonthlyRevenue._sum.amount || 0)

  const lastMonthRevenue =
    (productLastMonthRevenue._sum.amount || 0) +
    (airtimeLastMonthRevenue._sum.amount || 0) +
    (zesaLastMonthRevenue._sum.amount || 0) +
    (ticketLastMonthRevenue._sum.amount || 0)

  const recentTransactions = [
    ...recentProduct.map((r) => normalizeRow('product', r)),
    ...recentAirtime.map((r) => normalizeRow('airtime', r)),
    ...recentZesa.map((r) => normalizeRow('zesa', r)),
    ...recentTickets.map((r) => normalizeRow('ticket', r)),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return {
    currency: 'USD',
    totalOrders,
    totalRevenue,
    monthlyRevenue,
    lastMonthRevenue,
    pendingOrders,
    totalCustomers,
    recentTransactions,
    breakdown: {
      product: { orders: productOrdersCount, revenue: productRevenue._sum.amount || 0 },
      airtime: { orders: airtimeOrdersCount, revenue: airtimeRevenue._sum.amount || 0 },
      zesa: { orders: zesaOrdersCount, revenue: zesaRevenue._sum.amount || 0 },
      ticket: { orders: ticketOrdersCount, revenue: ticketRevenue._sum.amount || 0 },
    },
  }
}
