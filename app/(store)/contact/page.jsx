'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const KINDS = [
  { value: 'support', label: 'Order / payment issue' },
  { value: 'event_listing', label: 'List an event on Shoppy' },
  { value: 'general', label: 'General inquiry' },
]

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  const [kind, setKind] = useState('support')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    orderNumber: '',
    message: '',

    // event fields
    eventName: '',
    eventDate: '',
    eventCity: '',
    eventVenue: '',
    ticketInfo: '',
    organiserContact: '',

    // honeypot
    website: '',
  })

  const kindLabel = useMemo(() => KINDS.find((k) => k.value === kind)?.label || 'Contact', [kind])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, ...form }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to submit')
      setDone(data)
    } catch (e2) {
      setError(e2.message)
    } finally {
      setLoading(false)
    }
  }

  if (done?.success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Message received</h1>
        <p className="mt-3 text-gray-600">
          Thanks — we got your message. Reference: <span className="font-mono text-gray-900">{done.reference}</span>
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800">
            Back to home
          </Link>
          <Link href="/support" className="inline-flex justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 px-6 py-3 font-semibold hover:bg-gray-50">
            Read support notes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Contact</h1>
      <p className="mt-3 text-gray-600">Get help, report issues, or submit an event to be listed.</p>

      <form onSubmit={submit} className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What do you need?</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>

        {/* honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="you@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone / WhatsApp</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Optional"
            />
          </div>

          {kind === 'support' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order number</label>
              <input
                value={form.orderNumber}
                onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                placeholder="e.g. AIR-20260216-001"
              />
            </div>
          )}
        </div>

        {kind === 'event_listing' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-gray-900">Event details</p>
            <p className="text-sm text-gray-700 mt-1">Share as much as you can — we’ll format the listing.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event name *</label>
                <input
                  required
                  value={form.eventName}
                  onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Concert / Meetup / etc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & time *</label>
                <input
                  required
                  value={form.eventDate}
                  onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Sat 12 Apr 2026, 6PM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  value={form.eventCity}
                  onChange={(e) => setForm((f) => ({ ...f, eventCity: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <input
                  value={form.eventVenue}
                  onChange={(e) => setForm((f) => ({ ...f, eventVenue: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ticket types & prices</label>
              <textarea
                rows={3}
                value={form.ticketInfo}
                onChange={(e) => setForm((f) => ({ ...f, ticketInfo: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                placeholder="e.g. General $5, VIP $20"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Organiser contact *</label>
              <input
                required
                value={form.organiserContact}
                onChange={(e) => setForm((f) => ({ ...f, organiserContact: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="phone/email/telegram"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            placeholder={kind === 'support'
              ? 'Describe the issue and include any payment details (tx hash, network, etc.)'
              : kind === 'event_listing'
                ? 'Any extra info (dress code, age restriction, links, images, etc.)'
                : 'How can we help?'}
          />
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? 'Sending…' : `Send (${kindLabel})`}
          </button>
          <Link
            href="/support"
            className="inline-flex justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 px-6 py-3 font-semibold hover:bg-gray-50"
          >
            Read support notes
          </Link>
        </div>

        <p className="text-xs text-gray-500">
          Tip: For crypto issues, include your order number, coin/network, and transaction hash.
        </p>
      </form>
    </div>
  )
}
