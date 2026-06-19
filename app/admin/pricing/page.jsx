'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AdminPricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (session) fetchSettings()
  }, [session])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pricing')
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load pricing settings')
      setSettings(data.settings || [])
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  function patch(key, next) {
    setSettings((arr) => arr.map((s) => (s.key === key ? { ...s, ...next } : s)))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: settings.map((s) => ({
            key: s.key,
            value: Number(s.value),
            note: s.note || null,
          })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setSettings(data.settings || [])
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
          <h1 className="text-3xl font-bold text-gray-900">Pricing / Premiums</h1>
          <p className="text-gray-500 mt-1">Control markups used at checkout (no redeploy needed).</p>
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
            {settings.map((s) => {
              const label =
                s.key === 'airtime_markup_rate' ? 'Airtime markup' :
                s.key === 'zesa_markup_rate' ? 'ZESA markup' :
                s.key === 'usd_zig_rate' ? 'USD → ZiG rate' :
                s.key

              const hint =
                s.key === 'airtime_markup_rate' ? 'Example: 0.02 = 2%' :
                s.key === 'zesa_markup_rate' ? 'Example: 0.01 = 1%' :
                s.key === 'usd_zig_rate' ? '1 USD = X ZiG for ZESA cross-currency purchases' :
                'Value'

              const step = s.key === 'usd_zig_rate' ? '0.01' : '0.0001'

              return (
                <div key={s.key} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500 mt-1">{hint}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Value</label>
                    <input
                      type="number"
                      step={step}
                      onWheel={(e) => e.target.blur()}
                      value={s.value}
                      onChange={(e) => patch(s.key, { value: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="0.02"
                    />
                  </div>
                </div>
              )
            })}

            {!settings.length && (
              <div className="p-6 text-gray-500">No settings found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
