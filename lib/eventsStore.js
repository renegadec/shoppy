import prisma from './prisma'

export async function getPublicEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        active: true,
        startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        ticketTypes: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
    return events
  } catch (e) {
    // Fallback: read local JSON (useful for dev when DB is unreachable)
    try {
      const fs = await import('fs')
      const path = await import('path')
      const p = path.join(process.cwd(), 'data', 'events.json')
      const raw = fs.readFileSync(p, 'utf8')
      const json = JSON.parse(raw)
      const now = Date.now()
      return (Array.isArray(json) ? json : []).map((ev) => {
        const startsAt = ev.date ? new Date(ev.date) : new Date(now)
        return {
          id: ev.slug,
          slug: ev.slug,
          title: ev.title,
          subtitle: ev.subtitle || null,
          description: ev.description || ev.excerpt || null,
          venue: ev.venue || null,
          city: ev.city || null,
          image: ev.image || null,
          startsAt,
          ticketTypes: (ev.ticketTypes || []).map((t, i) => ({
            id: `${ev.slug}:${t.name}`,
            name: t.name,
            price: t.price,
            currency: ev.currency || 'USD',
            active: true,
            sortOrder: i,
          })),
        }
      })
    } catch {
      return []
    }
  }
}

export async function getPublicEventBySlug(slug) {
  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        ticketTypes: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
        },
      },
    })
    if (!event || !event.active || !event.published) return null
    return event
  } catch {
    const all = await getPublicEvents()
    return all.find((e) => e.slug === slug) || null
  }
}

export function formatEventDate(d) {
  try {
    const dateObj = d instanceof Date ? d : new Date(d)
    return new Intl.DateTimeFormat('en-ZW', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch {
    return String(d)
  }
}
