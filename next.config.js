/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'efyepyouofoyoafegyxd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // (legacy) output tracing includes kept for safety
  outputFileTracingIncludes: {
    '/api/webhook': ['node_modules/pdfkit/js/data/**'],
    '/api/tickets/checkout': ['node_modules/pdfkit/js/data/**'],
    '/api/admin/ticket-orders/[id]/resend': ['node_modules/pdfkit/js/data/**'],
    '/api/admin/ticket-orders': ['node_modules/pdfkit/js/data/**'],
  },
}

module.exports = nextConfig
