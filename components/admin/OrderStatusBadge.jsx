const statusConfig = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
  PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Paid' },
  PARTIALLY_PAID: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Partial' },
  DELIVERED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Delivered' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' },
}

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.PENDING
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
