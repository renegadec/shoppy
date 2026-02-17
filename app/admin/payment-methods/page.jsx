'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AdminPaymentMethodsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (session) fetchMethods()
  }, [session])

  async function fetchMethods() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payment-methods')
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load payment methods')
      setMethods(data.methods || [])
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  function patch(key, next) {
    setMethods((m) => m.map((x) => (x.key === key ? { ...x, ...next } : x)))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methods: methods.map((m) => ({
            key: m.key,
            enabled: Boolean(m.enabled),
            note: m.note || null,
            sortOrder: m.sortOrder,
          })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setMethods(data.methods || [])
      alert('Saved')
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment methods</h1>
          <p className="text-gray-500 mt-1">Enable/disable checkout options and show a note to customers.</p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {methods.map((m) => (
              <div key={m.key} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900">{m.key}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${m.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {m.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Shown to customers when disabled (optional)</p>
                </div>

                <div className="flex-1 md:max-w-xl w-full grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600">Note</label>
                    <input
                      value={m.note || ''}
                      onChange={(e) => patch(m.key, { note: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. EcoCash is down for maintenance"
                    />
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(m.enabled)}
                        onChange={(e) => patch(m.key, { enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Enabled
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
