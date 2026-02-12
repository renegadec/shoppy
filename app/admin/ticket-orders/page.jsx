'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/admin/DataTable'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import Modal from '@/components/admin/Modal'

export default function TicketOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [resending, setResending] = useState(false)

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
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/ticket-orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error('fetch ticket orders error', e)
    } finally {
      setLoading(false)
    }
  }

  async function resendEmail(orderId) {
    setResending(true)
    try {
      const res = await fetch(`/api/admin/ticket-orders/${orderId}/resend`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to resend')
      alert('Ticket email sent')
    } catch (e) {
      alert(e.message)
    } finally {
      setResending(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const columns = [
    {
      header: 'Order #',
      render: (row) => <span className="font-mono text-sm text-emerald-600 font-medium">{row.orderNumber}</span>,
    },
    {
      header: 'Event',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.event?.title}</p>
          <p className="text-sm text-gray-500">{row.event?.slug}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (row) => <span className="text-gray-900">{row.customer?.email}</span>,
    },
    {
      header: 'Amount',
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
        <h1 className="text-3xl font-bold text-gray-900">Ticket Orders</h1>
        <p className="text-gray-500 mt-1">Support: resend tickets, verify status, and view ticket codes</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchOrders()
            }}
            className="flex-1"
          >
            <input
              type="text"
              placeholder="Search by order #, email, or event title..."
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
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading ticket orders...</div>
      ) : (
        <>
          <DataTable columns={columns} data={orders} onRowClick={setSelected} emptyMessage="No ticket orders found" />

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
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Ticket Order ${selected?.orderNumber || ''}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <OrderStatusBadge status={selected.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-semibold text-lg">${selected.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Event</p>
                <p className="font-medium">{selected.event?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer email</p>
                <p className="font-medium">{selected.customer?.email}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Tickets</h4>
              <div className="space-y-2">
                {(selected.items || []).map((it) => (
                  <div key={it.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{it.ticketType?.name || 'Ticket'}</p>
                      <p className="text-xs text-gray-500">Code: {it.ticketCode}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${it.redeemed ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {it.redeemed ? 'Redeemed' : 'Valid'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <button
                onClick={() => resendEmail(selected.id)}
                disabled={resending}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend ticket email'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">Sends QR tickets to the customer’s email.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
