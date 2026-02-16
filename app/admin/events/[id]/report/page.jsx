'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'

export default function EventReportPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const eventId = useMemo(() => {
    const fromParams = params?.id
    if (fromParams && fromParams !== 'undefined') return fromParams
    const parts = String(pathname || '').split('/').filter(Boolean)
    // /admin/events/:id/report
    return parts[2] || ''
  }, [params?.id, pathname])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}/report`)
        const d = await res.json()
        setData(d)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [session, eventId])

  if (status === 'loading' || loading) return <div className="text-gray-500">Loading report…</div>
  if (!session) return null

  const totals = data?.totals
  const breakdown = data?.breakdown || []

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => router.push('/admin/events')} className="text-gray-500 hover:text-gray-700 mb-3">
        ← Back to Events
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Sales Report</h1>
          <p className="text-gray-500 mt-1">{totals?.eventTitle}</p>
        </div>

        <div className="flex gap-3">
          <a
            href={eventId ? `/admin/events/${eventId}/scanners` : '#'}
            onClick={(e) => {
              if (!eventId) {
                e.preventDefault()
                alert('Missing event id. Please refresh and try again.')
              }
            }}
            className="inline-flex justify-center rounded-xl bg-white border border-gray-200 text-gray-900 px-5 py-3 font-semibold hover:bg-gray-50"
          >
            Scanner users
          </a>
          <a
            href={`/api/admin/events/${eventId}/report?format=csv`}
            className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Paid orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totals?.paidOrders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Tickets sold</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totals?.ticketsSold ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Revenue (USD)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${Number(totals?.revenue || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">By ticket type</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Ticket</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Sold</th>
                <th className="py-2 pr-4">Revenue</th>
                <th className="py-2 pr-4">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.ticketTypeId} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{b.name}</td>
                  <td className="py-2 pr-4">${Number(b.price || 0).toFixed(2)}</td>
                  <td className="py-2 pr-4">{b.sold}</td>
                  <td className="py-2 pr-4">${Number(b.revenue || 0).toFixed(2)}</td>
                  <td className="py-2 pr-4">{b.remaining == null ? '—' : b.remaining}</td>
                </tr>
              ))}
              {!breakdown.length && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={5}>No sales yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
