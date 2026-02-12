'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DataTable from '@/components/admin/DataTable'
import ImageUpload from '@/components/admin/ImageUpload'

const emptyEvent = {
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  venue: '',
  city: 'Harare',
  startsAt: '',
  endsAt: '',
  organizerName: '',
  organizerRef: '',
  image: '',
  published: false,
  active: true,
  ticketTypes: [{ name: 'General', price: '', currency: 'USD', capacity: '', active: true, sortOrder: 0 }],
}

export default function AdminEventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(emptyEvent)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (session) fetchEvents()
  }, [session])

  async function fetchEvents() {
    try {
      const res = await fetch('/api/admin/events')
      if (res.ok) setEvents(await res.json())
    } catch (e) {
      console.error('fetchEvents error', e)
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setFormData(emptyEvent)
    setShowForm(true)
  }

  function openEdit(ev) {
    setEditing(ev)
    setFormData({
      slug: ev.slug || '',
      title: ev.title || '',
      subtitle: ev.subtitle || '',
      description: ev.description || '',
      venue: ev.venue || '',
      city: ev.city || '',
      startsAt: ev.startsAt ? new Date(ev.startsAt).toISOString().slice(0, 16) : '',
      endsAt: ev.endsAt ? new Date(ev.endsAt).toISOString().slice(0, 16) : '',
      organizerName: ev.organizerName || '',
      organizerRef: ev.organizerRef || '',
      image: ev.image || '',
      published: Boolean(ev.published),
      active: ev.active !== false,
      ticketTypes: (ev.ticketTypes?.length ? ev.ticketTypes : emptyEvent.ticketTypes).map((t, idx) => ({
        name: t.name || '',
        price: t.price?.toString?.() ?? String(t.price ?? ''),
        currency: t.currency || 'USD',
        capacity: t.capacity?.toString?.() ?? String(t.capacity ?? ''),
        active: t.active !== false,
        sortOrder: t.sortOrder ?? idx,
      })),
    })
    setShowForm(true)
  }

  function addTicketType() {
    setFormData((f) => ({
      ...f,
      ticketTypes: [...f.ticketTypes, { name: '', price: '', currency: 'USD', capacity: '', active: true, sortOrder: f.ticketTypes.length }],
    }))
  }

  function updateTicketType(i, patch) {
    setFormData((f) => {
      const next = [...f.ticketTypes]
      next[i] = { ...next[i], ...patch }
      return { ...f, ticketTypes: next }
    })
  }

  function removeTicketType(i) {
    setFormData((f) => ({ ...f, ticketTypes: f.ticketTypes.filter((_, idx) => idx !== i) }))
  }

  async function save() {
    setSaving(true)
    try {
      const url = editing ? `/api/admin/events/${editing.id}` : '/api/admin/events'
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save')

      await fetchEvents()
      setShowForm(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function del(ev) {
    if (!confirm(`Deactivate "${ev.title}"?`)) return

    const res = await fetch(`/api/admin/events/${ev.id}`, { method: 'DELETE' })
    if (res.ok) fetchEvents()
  }

  const columns = useMemo(
    () => [
      {
        header: 'Event',
        render: (row) => (
          <div>
            <p className="font-medium text-gray-900">{row.title}</p>
            <p className="text-sm text-gray-500">{row.slug}</p>
          </div>
        ),
      },
      {
        header: 'Starts',
        render: (row) => (row.startsAt ? new Date(row.startsAt).toLocaleString() : '-'),
      },
      {
        header: 'Tickets',
        render: (row) => <span className="text-gray-700">{row.ticketTypes?.length || 0}</span>,
      },
      {
        header: 'Status',
        render: (row) => (
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
              {row.active ? 'Active' : 'Inactive'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${row.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
              {row.published ? 'Published' : 'Draft'}
            </span>
          </div>
        ),
      },
      {
        header: '',
        render: (row) => (
          <div className="flex gap-1 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openEdit(row)
              }}
              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                del(row)
              }}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              🗑️
            </button>
          </div>
        ),
      },
    ],
    []
  )

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  if (showForm) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
              ← Back to Events
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{editing ? 'Edit Event' : 'New Event'}</h1>
            <p className="text-gray-500 mt-1">Marketplace listing for organisers</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !formData.title || !formData.slug || !formData.startsAt}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ImageUpload value={formData.image} onChange={(url) => setFormData((f) => ({ ...f, image: url }))} />
              <p className="text-xs text-gray-500 mt-2">Recommended: 1600×900 JPG/WEBP</p>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Event name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                  <input
                    value={formData.slug}
                    onChange={(e) => setFormData((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. harare-tech-meetup"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  value={formData.subtitle}
                  onChange={(e) => setFormData((f) => ({ ...f, subtitle: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Harare • Music • Networking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="What is this event about?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starts At *</label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData((f) => ({ ...f, startsAt: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ends At</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData((f) => ({ ...f, endsAt: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <input
                    value={formData.venue}
                    onChange={(e) => setFormData((f) => ({ ...f, venue: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Venue name / address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    value={formData.city}
                    onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Harare"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organiser name</label>
                  <input
                    value={formData.organizerName}
                    onChange={(e) => setFormData((f) => ({ ...f, organizerName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organiser contact (internal)</label>
                  <input
                    value={formData.organizerRef}
                    onChange={(e) => setFormData((f) => ({ ...f, organizerRef: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="phone/email/handle"
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData((f) => ({ ...f, published: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">Published (visible on /events)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData((f) => ({ ...f, active: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Ticket types</h2>
                <p className="text-sm text-gray-500">Add ticket options (General, VIP, etc.).</p>
              </div>
              <button onClick={addTicketType} className="text-emerald-600 font-semibold hover:text-emerald-700">
                + Add ticket type
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {formData.ticketTypes.map((t, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600">Name</label>
                      <input
                        value={t.name}
                        onChange={(e) => updateTicketType(i, { name: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="General"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={t.price}
                        onChange={(e) => updateTicketType(i, { price: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Capacity</label>
                      <input
                        type="number"
                        value={t.capacity}
                        onChange={(e) => updateTicketType(i, { capacity: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="optional"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={t.active}
                          onChange={(e) => updateTicketType(i, { active: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Active
                      </label>
                      <button onClick={() => removeTicketType(i)} className="text-sm text-gray-500 hover:text-red-600">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">List events from organisers and sell tickets</p>
        </div>
        <button onClick={openNew} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <span>+</span> Add Event
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      ) : (
        <DataTable columns={columns} data={events} onRowClick={openEdit} emptyMessage="No events yet. Add your first event!" />
      )}
    </div>
  )
}
