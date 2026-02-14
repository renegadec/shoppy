'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import Modal from '@/components/admin/Modal'

export default function AirtimeOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (session) fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, filter, pagination.page])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        status: filter,
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/admin/airtime-orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error('Fetch airtime orders error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchOrders()
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const columns = [
    {
      header: 'Order #',
      render: (row) => <span className="font-mono text-sm text-emerald-600 font-medium">{row.orderNumber}</span>,
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.customer?.email}</p>
          <p className="text-sm text-gray-500">{row.contactMethod}: {row.contactValue}</p>
        </div>
      ),
    },
    {
      header: 'Airtime',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{String(row.network || '').toUpperCase()} • {row.recipientMsisdn}</p>
          <p className="text-sm text-gray-500">Recipient gets: ${row.airtimeAmount}</p>
        </div>
      ),
    },
    {
      header: 'Customer Pays',
      render: (row) => <span className="font-semibold">${row.amount}</span>,
    },
    {
      header: 'Status',
      render: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Airtime Orders</h1>
        <p className="text-gray-500 mt-1">Automatic topups via Hot Recharge API</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              placeholder="Search by order #, email, or recipient number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </form>

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
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
        <div className="text-center py-12 text-gray-500">Loading airtime orders...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={orders}
            onRowClick={setSelectedOrder}
            emptyMessage="No airtime orders found"
          />

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPagination((p) => ({ ...p, page: i + 1 }))}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === i + 1 ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'
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
        title={`Airtime Order ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Status</p>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <p className="text-gray-500">Payment</p>
                <p className="font-medium">{selectedOrder.paymentMethod} • {selectedOrder.paymentStatus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Recipient</p>
                <p className="font-medium">{selectedOrder.recipientMsisdn}</p>
              </div>
              <div>
                <p className="text-gray-500">Network</p>
                <p className="font-medium">{String(selectedOrder.network || '').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-gray-500">Recipient gets</p>
                <p className="font-semibold">${selectedOrder.airtimeAmount}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer pays</p>
                <p className="font-semibold">${selectedOrder.amount}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-gray-500">Hot Recharge</p>
              <p>ProductId: {selectedOrder.hotProductId ?? 'N/A'} • RechargeId: {selectedOrder.hotRechargeId ?? 'N/A'}</p>
              {selectedOrder.hotMessage && <p className="text-gray-700 mt-2">Message: {selectedOrder.hotMessage}</p>}
              {selectedOrder.deliveryNotes && <p className="text-gray-700 mt-2">Notes: {selectedOrder.deliveryNotes}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
