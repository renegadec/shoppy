'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import StatsCard from '@/components/admin/StatsCard'
import DataTable from '@/components/admin/DataTable'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])
  
  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])
  
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }
  
  if (!session) {
    return null
  }
  
  const revenueGrowth = stats?.lastMonthRevenue > 0 
    ? Math.round(((stats?.monthlyRevenue - stats?.lastMonthRevenue) / stats?.lastMonthRevenue) * 100)
    : 0
  
  const orderColumns = [
    {
      header: 'Service',
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
          {row.type}
        </span>
      ),
    },
    {
      header: 'Order',
      render: (row) => (
        <span className="font-mono text-sm text-emerald-600">{row.orderNumber}</span>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.customerEmail || '—'}</p>
          {row.customerName && <p className="text-sm text-gray-500">{row.customerName}</p>}
        </div>
      )
    },
    {
      header: 'Details',
      render: (row) => <span className="text-sm text-gray-700">{row.label || '—'}</span>,
    },
    {
      header: 'Amount',
      render: (row) => `$${Number(row.amount || 0).toFixed(2)}`
    },
    {
      header: 'Status',
      render: (row) => <OrderStatusBadge status={row.status} />
    },
    {
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString()
    }
  ]
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
          subtitle="All time"
          icon="💰"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${stats?.monthlyRevenue?.toFixed(2) || '0.00'}`}
          subtitle="This month"
          icon="📈"
          trend={revenueGrowth}
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          subtitle={`${stats?.pendingOrders || 0} pending`}
          icon="📦"
        />
        <StatsCard
          title="Customers"
          value={stats?.totalCustomers || 0}
          subtitle="All time"
          icon="👥"
        />
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          <a href="/admin/orders" className="text-emerald-600 hover:text-emerald-700 font-medium">
            View all →
          </a>
        </div>
        <DataTable
          columns={orderColumns}
          data={stats?.recentTransactions || []}
          onRowClick={(row) => {
            if (row.type === 'product') return router.push(`/admin/orders?id=${row.id}`)
            if (row.type === 'airtime') return router.push(`/admin/airtime-orders?orderNumber=${encodeURIComponent(row.orderNumber)}`)
            if (row.type === 'zesa') return router.push(`/admin/zesa-orders?orderNumber=${encodeURIComponent(row.orderNumber)}`)
            if (row.type === 'ticket') return router.push(`/admin/ticket-orders?orderNumber=${encodeURIComponent(row.orderNumber)}`)
          }}
          emptyMessage="No sales yet"
        />
      </div>
    </div>
  )
}
