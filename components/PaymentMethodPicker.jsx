'use client'

export default function PaymentMethodPicker({
  label = 'Payment Method',
  methods,
  value,
  onChange,
  descriptions,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-3 gap-3',
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className={gridClassName}>
        {methods.map((m) => {
          const disabled = !m.enabled
          const desc =
            disabled
              ? (m.note || 'Temporarily unavailable')
              : (descriptions?.[m.key] || '')

          return (
            <button
              key={m.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(m.key)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                value === m.key
                  ? 'border-emerald-600 bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-gray-200' : ''}`}
            >
              <div className="text-sm font-semibold text-gray-900">{m.label}</div>
              {desc ? <div className="text-xs text-gray-500 mt-1">{desc}</div> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
