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

  // Ensure serverless bundles include PDFKit font metric files (AFM)
  outputFileTracingIncludes: {
    '/api/webhook': ['node_modules/pdfkit/js/data/*.afm'],
    '/api/admin/ticket-orders/[id]/resend': ['node_modules/pdfkit/js/data/*.afm'],
    '/api/admin/ticket-orders': ['node_modules/pdfkit/js/data/*.afm'],
  },
}

module.exports = nextConfig
