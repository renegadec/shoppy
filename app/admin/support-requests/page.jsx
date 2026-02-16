'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import Modal from '@/components/admin/Modal'

const KIND_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'support', label: 'Order / payment issues' },
  { value: 'event_listing', label: 'Event listings' },
  { value: 'general', label: 'General' },
]

function formatKind(k) {
  if (k === 'event_listing') return 'Event listing'
  if (k === 'support') return 'Support'
  if (k === 'general') return 'General'
  return k || 'Unknown'
}

export default function SupportRequestsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [warning, setWarning] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (session) fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, kind, pagination.page])

  async function fetchItems() {
    setLoading(true)
    setWarning('')

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        kind,
        ...(q ? { q } : {}),
      })

      const res = await fetch(`/api/admin/support-requests?${params}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')

      setItems(data?.items || [])
      setPagination(data?.pagination || { page: 1, pages: 1 })
      if (data?.warning) setWarning(data.warning)
    } catch (e) {
      console.error('Fetch support requests error:', e)
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        header: 'Type',
        render: (row) => (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {formatKind(row.kind)}
          </span>
        ),
      },
      {
        header: 'From',
        render: (row) => (
          <div>
            <p className="font-medium text-gray-900">{row.email}</p>
            {(row.name || row.phone) && (
              <p className="text-sm text-gray-500">
                {[row.name, row.phone].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        ),
      },
      {
        header: 'Order/Event',
        render: (row) => (
          <div>
            {row.orderNumber && <p className="font-mono text-sm text-emerald-700">{row.orderNumber}</p>}
            {row.eventName && <p className="text-sm text-gray-700">{row.eventName}</p>}
            {!row.orderNumber && !row.eventName && <span className="text-sm text-gray-400">—</span>}
          </div>
        ),
      },
      {
        header: 'Message',
        render: (row) => (
          <p className="text-sm text-gray-700 line-clamp-2 max-w-xl">{row.message}</p>
        ),
      },
      {
        header: 'Date',
        render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : ''),
      },
    ],
    []
  )

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support Requests</h1>
        <p className="text-gray-500 mt-1">Messages submitted from /contact</p>
      </div>

      {warning && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          {warning}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setPagination((p) => ({ ...p, page: 1 }))
              fetchItems()
            }}
            className="flex-1"
          >
            <input
              type="text"
              placeholder="Search email, order number, event name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </form>

          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading messages...</div>
      ) : (
        <>
          <DataTable columns={columns} data={items} onRowClick={setSelected} emptyMessage="No support requests yet" />

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
        title={`Message (${formatKind(selected?.kind)})`}
        size="lg"
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{selected.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{selected.phone || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{selected.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</p>
              </div>
            </div>

            {(selected.orderNumber || selected.eventName) && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                {selected.orderNumber && (
                  <p>
                    <span className="text-gray-500">Order:</span> <span className="font-mono">{selected.orderNumber}</span>
                  </p>
                )}
                {selected.eventName && (
                  <p className="mt-2">
                    <span className="text-gray-500">Event:</span> <span className="font-semibold">{selected.eventName}</span>
                  </p>
                )}
                {selected.eventDate && <p className="text-gray-700">Date: {selected.eventDate}</p>}
                {(selected.eventCity || selected.eventVenue) && (
                  <p className="text-gray-700">
                    Location: {[selected.eventCity, selected.eventVenue].filter(Boolean).join(' • ') || '—'}
                  </p>
                )}
                {selected.ticketInfo && (
                  <p className="text-gray-700 mt-2">Tickets: {selected.ticketInfo}</p>
                )}
                {selected.organiserContact && (
                  <p className="text-gray-700 mt-2">Organiser: {selected.organiserContact}</p>
                )}
              </div>
            )}

            <div>
              <p className="text-gray-500">Message</p>
              <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-gray-900">
                {selected.message}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent('Shoppy support: ' + (selected.orderNumber || 'your message'))}`}
                className="inline-flex justify-center rounded-xl bg-gray-900 text-white px-4 py-2 font-semibold hover:bg-black"
              >
                Reply via email
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selected.email)
                }}
                className="inline-flex justify-center rounded-xl bg-white border border-gray-200 text-gray-900 px-4 py-2 font-semibold hover:bg-gray-50"
              >
                Copy email
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
