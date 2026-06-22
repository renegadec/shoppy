import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/solid'

function currencySymbol(code) {
  if (!code) return '$'
  const up = String(code).toUpperCase()
  if (up === 'USD') return '$'
  if (up === 'ZWG') return 'ZiG'
  return code
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] break-words">{value}</span>
    </div>
  )
}

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}

export function AirtimeOrderSummary({ order }) {
  if (!order) return null

  const networkLabel =
    {
      econet: 'Econet',
      netone: 'NetOne',
      telecel: 'Telecel',
    }[String(order.network).toLowerCase()] || order.network

  const symbol = currencySymbol(order.currency)
  const statusBadge = order.status === 'PAID' || order.delivered
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-amber-100 text-amber-800'
  const statusLabel = order.delivered ? 'Delivered' : order.status === 'PAID' ? 'Paid' : order.status

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 text-left">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        <Badge className={statusBadge}>{statusLabel}</Badge>
      </div>
      <div className="divide-y divide-gray-100">
        <Row label="Order" value={order.orderNumber} />
        <Row label="Product" value={`${networkLabel} Airtime`} />
        <Row label="Recipient" value={order.recipientMsisdn} />
        <Row label="Airtime Amount" value={`${symbol}${Number(order.airtimeAmount).toFixed(2)}`} />
        {order.currency !== 'USD' ? (
          <Row label="You paid" value={`$${Number(order.amount).toFixed(2)}`} />
        ) : null}
      </div>
    </div>
  )
}

export function ZesaOrderSummary({ order }) {
  if (!order) return null

  const statusBadge = order.status === 'PAID' || order.delivered
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-amber-100 text-amber-800'
  const statusLabel = order.delivered ? 'Delivered' : order.status === 'PAID' ? 'Paid' : order.status

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 text-left">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        <Badge className={statusBadge}>{statusLabel}</Badge>
      </div>
      <div className="divide-y divide-gray-100">
        <Row label="Order" value={order.orderNumber} />
        <Row label="Product" value="ZESA Token" />
        <Row label="Meter Number" value={order.meterNumber} />
        <Row label="Token Amount" value={`${currencySymbol(order.currency)}${Number(order.tokenAmount).toFixed(2)}`} />
      </div>
    </div>
  )
}

export function ProductOrderSummary({ order }) {
  if (!order) return null

  const statusBadge = order.status === 'PAID' || order.delivered
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-amber-100 text-amber-800'
  const statusLabel = order.delivered ? 'Delivered' : order.status === 'PAID' ? 'Paid' : order.status

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 text-left">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        <Badge className={statusBadge}>{statusLabel}</Badge>
      </div>
      <div className="divide-y divide-gray-100">
        <Row label="Order" value={order.orderNumber} />
        <Row label="Product" value={order.product?.name || 'Unknown Product'} />
        <Row label="Amount" value={`$${Number(order.amount).toFixed(2)}`} />
        {order.contactValue ? <Row label="Contact" value={order.contactValue} /> : null}
      </div>
    </div>
  )
}
