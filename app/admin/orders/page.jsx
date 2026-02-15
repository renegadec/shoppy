'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import Modal from '@/components/admin/Modal'

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])
  
  useEffect(() => {
    if (session) {
      fetchOrders()
    }
  }, [session, filter, pagination.page])
  
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        status: filter,
        ...(search && { search })
      })
      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSearch = (e) => {
    e.preventDefault()
    fetchOrders()
  }
  
  const markDelivered = async (orderId) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivered: true })
      })
      if (res.ok) {
        fetchOrders()
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null
  
  const columns = [
    {
      header: 'Order #',
      render: (row) => (
        <span className="font-mono text-sm text-emerald-600 font-medium">{row.orderNumber}</span>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.customer?.email}</p>
          {row.contactValue && row.contactMethod !== 'email' && (
            <p className="text-sm text-gray-500">{row.contactMethod}: {row.contactValue}</p>
          )}
        </div>
      )
    },
    {
      header: 'Product',
      render: (row) => row.product?.name
    },
    {
      header: 'Amount',
      render: (row) => <span className="font-semibold">${row.amount}</span>
    },
    {
      header: 'Payment',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.paymentMethod}</p>
          <p className="text-xs text-gray-500">{row.paymentStatus || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => <OrderStatusBadge status={row.status} />
    },
    {
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ]
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage and track all orders</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              placeholder="Search by order #, email, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </form>
          
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPagination(p => ({ ...p, page: 1 }))
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading orders...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={orders}
            onRowClick={setSelectedOrder}
            emptyMessage="No orders found"
          />
          
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === i + 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-semibold text-lg">${selectedOrder.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium">{selectedOrder.product?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Customer Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Email:</span> {selectedOrder.customer?.email}</p>
                {selectedOrder.customer?.name && (
                  <p><span className="text-gray-500">Name:</span> {selectedOrder.customer.name}</p>
                )}
                {selectedOrder.contactMethod && (
                  <p><span className="text-gray-500">{selectedOrder.contactMethod}:</span> {selectedOrder.contactValue}</p>
                )}
              </div>
            </div>
            
            {selectedOrder.status === 'PAID' && !selectedOrder.delivered && (
              <div className="border-t pt-4">
                <button
                  onClick={() => markDelivered(selectedOrder.id)}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  ✓ Mark as Delivered
                </button>
              </div>
            )}
            
            {selectedOrder.delivered && (
              <div className="border-t pt-4">
                <p className="text-emerald-600 font-medium">
                  ✓ Delivered on {new Date(selectedOrder.deliveredAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
