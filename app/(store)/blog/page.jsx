import Link from 'next/link'

export const metadata = {
  title: 'Blog',
  description: 'Updates, guides, and product notes from Shoppy.',
}

const POSTS = [
  {
    slug: 'how-to-pay-with-crypto',
    title: 'How to pay with crypto on Shoppy (and avoid wrong-network mistakes)',
    excerpt: 'A quick guide to paying with USDT/BTC/ETH, confirmations, and common errors like sending on the wrong network.',
    date: '2026-02-16',
    tag: 'Guides',
  },
  {
    slug: 'listing-events-on-shoppy',
    title: 'How to list your event on Shoppy',
    excerpt: 'What details to send, how ticket types work, and how we deliver QR tickets.',
    date: '2026-02-16',
    tag: 'Events',
  },
]

export default function BlogPage() {
  return (
    <div>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Blog</h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            Guides, updates, and short notes to help you buy services safely and get the best experience.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {POSTS.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {p.tag}
                </span>
                <span className="text-xs text-gray-500">{p.date}</span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900 group-hover:text-gray-800">
                {p.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {p.excerpt}
              </p>

              <div className="mt-5 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                Read →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 p-6">
          <p className="font-semibold text-gray-900">Want us to cover a topic?</p>
          <p className="text-sm text-gray-700 mt-1">Send suggestions — we’ll write practical guides.</p>
          <div className="mt-4">
            <Link href="/contact" className="inline-flex justify-center rounded-2xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800">
              Suggest a topic
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
