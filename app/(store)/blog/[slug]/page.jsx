import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const POSTS = {
  'how-to-pay-with-crypto': {
    title: 'How to pay with crypto on Shoppy (and avoid wrong-network mistakes)',
    date: '2026-02-16',
    body: [
      'When paying with crypto, always match the coin AND the network shown on the invoice (e.g. USDT TRC20 vs USDT BSC).',
      'If you send on the wrong network, the payment may not be detected automatically.',
      '',
      'Tips:',
      '• Send the exact amount requested.',
      '• Wait for confirmations (can take a few minutes).',
      '• If your order stays pending, contact support with your order number + tx hash.',
    ].join('\n'),
  },
  'listing-events-on-shoppy': {
    title: 'How to list your event on Shoppy',
    date: '2026-02-16',
    body: [
      'To list your event, use the Contact page and choose “List an event on Shoppy”.',
      '',
      'Include:',
      '• Event name + date/time',
      '• City + venue',
      '• Ticket types and prices',
      '• Organiser contact',
    ].join('\n'),
  },
}

export default function BlogPostPage({ params }) {
  const post = POSTS[params.slug]
  if (!post) return notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/blog" className="text-emerald-700 font-semibold hover:underline">← Back to blog</Link>

      <article className="mt-6 rounded-3xl border border-gray-200 bg-white p-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2">{post.date}</p>

        <div className="mt-6 whitespace-pre-wrap text-gray-800 leading-7">
          {post.body}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-gray-900">Need help with a payment?</p>
          <p className="text-sm text-gray-700 mt-1">Use the support notes or send us a message.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link href="/support" className="inline-flex justify-center rounded-xl bg-white border border-emerald-200 text-emerald-900 px-5 py-3 font-semibold hover:bg-emerald-100">
              Support notes
            </Link>
            <Link href="/contact" className="inline-flex justify-center rounded-xl bg-emerald-700 text-white px-5 py-3 font-semibold hover:bg-emerald-800">
              Contact us
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
