'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function EventScannersPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const eventId = useMemo(() => {
    const fromParams = params?.id
    if (fromParams && fromParams !== 'undefined') return fromParams
    const parts = String(pathname || '').split('/').filter(Boolean)
    // /admin/events/:id/scanners
    return parts[2] || ''
  }, [params?.id, pathname])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [username, setUsername] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdPin, setCreatedPin] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/scanners`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setItems(data.items || [])
    } catch (e) {
      alert(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session || !eventId) return
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, eventId])

  async function createScanner() {
    if (!eventId) {
      alert('Missing event id. Please refresh and try again.')
      return
    }
    setCreating(true)
    setCreatedPin('')
    try {
      const res = await fetch(`/api/admin/events/${eventId}/scanners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setCreatedPin(data.pin)
      setUsername('')
      fetchItems()
    } catch (e) {
      alert(e?.message || 'Failed')
    } finally {
      setCreating(false)
    }
  }

  async function patch(scannerId, patch) {
    if (!eventId) {
      alert('Missing event id. Please refresh and try again.')
      return
    }
    const res = await fetch(`/api/admin/events/${eventId}/scanners/${scannerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error || 'Failed')
    if (data.pin) alert(`New PIN for ${data.item.username}: ${data.pin}`)
    await fetchItems()
  }

  if (status === 'loading' || loading) return <div className="text-gray-500">Loading…</div>
  if (!session) return null

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.push(`/admin/events/${eventId}/report`)} className="text-gray-500 hover:text-gray-700 mb-3">
        ← Back to Report
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scanner users</h1>
          <p className="text-gray-500 mt-1">Create multiple usernames for gates/devices. Share username + PIN with organisers.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Create scanner</h2>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (e.g. GateA, GateB)"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={createScanner}
            disabled={creating || !username}
            className="shrink-0 inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
        {createdPin && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
            PIN created: <span className="font-mono font-bold">{createdPin}</span> (copy it now — it won’t be shown again)
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Existing</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2 pr-4">Last used</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-mono font-semibold text-gray-900">{it.username}</td>
                  <td className="py-2 pr-4">{it.active ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4">{it.lastUsedAt ? new Date(it.lastUsedAt).toLocaleString() : '—'}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
                        onClick={() => patch(it.id, { resetPin: true })}
                      >
                        Reset PIN
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
                        onClick={() => patch(it.id, { active: !it.active })}
                      >
                        {it.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={4} className="py-3 text-gray-500">No scanner users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">Scan link</p>
        <p className="mt-1">Share this link with organisers:</p>
        <p className="mt-2 font-mono">{`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${'(event-slug)'}`}</p>
        <p className="mt-2">Replace <span className="font-mono">(event-slug)</span> with your event slug.</p>
      </div>
    </div>
  )
}
