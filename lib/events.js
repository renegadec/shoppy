import fs from 'fs'
import path from 'path'

export function getEvents() {
  const p = path.join(process.cwd(), 'data', 'events.json')
  const raw = fs.readFileSync(p, 'utf8')
  const events = JSON.parse(raw)
  return Array.isArray(events) ? events : []
}

export function getEventBySlug(slug) {
  return getEvents().find((e) => e.slug === slug) || null
}

export function formatEventDate(isoString) {
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('en-ZW', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return isoString
  }
}
