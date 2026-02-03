'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import Modal from '@/components/admin/Modal'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'

export default function CustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDetails, setCustomerDetails] = useState(null)
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])
  
  useEffect(() => {
    if (session) {
      fetchCustomers()
    }
  }, [session, pagination.page])
  
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        ...(search && { search })
      })
      const res = await fetch(`/api/admin/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchCustomerDetails = async (customerId) => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`)
      if (res.ok) {
        const data = await res.json()
        setCustomerDetails(data)
      }
    } catch (error) {
      console.error('Error fetching customer details:', error)
    }
  }
  
  const handleSearch = (e) => {
    e.preventDefault()
    fetchCustomers()
  }
  
  const openCustomerDetails = (customer) => {
    setSelectedCustomer(customer)
    setCustomerDetails(null)
    fetchCustomerDetails(customer.id)
  }
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null
  
  const columns = [
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.email}</p>
          {row.name && <p className="text-sm text-gray-500">{row.name}</p>}
        </div>
      )
    },
    {
      header: 'Contact',
      render: (row) => (
        <div className="text-sm text-gray-600">
          {row.telegram && <p>Telegram: {row.telegram}</p>}
          {row.whatsapp && <p>WhatsApp: {row.whatsapp}</p>}
          {row.phone && <p>Phone: {row.phone}</p>}
          {!row.telegram && !row.whatsapp && !row.phone && <p className="text-gray-400">Email only</p>}
        </div>
      )
    },
    {
      header: 'Orders',
      render: (row) => row._count?.orders || 0
    },
    {
      header: 'Total Spent',
      render: (row) => <span className="font-semibold">${row.totalSpent?.toFixed(2) || '0.00'}</span>
    },
    {
      header: 'Last Order',
      render: (row) => row.orders?.[0] 
        ? new Date(row.orders[0].createdAt).toLocaleDateString()
        : '-'
    }
  ]
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-1">View and manage customer data</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by email, name, or telegram..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </form>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading customers...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={customers}
            onRowClick={openCustomerDetails}
            emptyMessage="No customers yet"
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
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedCustomer.email}</p>
              </div>
              {selectedCustomer.name && (
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
              )}
              {selectedCustomer.telegram && (
                <div>
                  <p className="text-sm text-gray-500">Telegram</p>
                  <p className="font-medium">{selectedCustomer.telegram}</p>
                </div>
              )}
              {selectedCustomer.whatsapp && (
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="font-medium">{selectedCustomer.whatsapp}</p>
                </div>
              )}
            </div>
            
            {customerDetails?.stats && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{customerDetails.stats.totalOrders}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{customerDetails.stats.paidOrders}</p>
                    <p className="text-sm text-gray-500">Paid Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${customerDetails.stats.totalSpent.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                </div>
              </div>
            )}
            
            {customerDetails?.orders && customerDetails.orders.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Order History</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customerDetails.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm text-emerald-600">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.product?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.amount}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
