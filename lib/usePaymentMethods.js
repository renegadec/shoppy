'use client'

import { useEffect, useMemo, useState } from 'react'

const DEFAULT_METHODS = [
  { key: 'ecocash', label: 'EcoCash', enabled: true, note: null, sortOrder: 0 },
  { key: 'crypto', label: 'Crypto', enabled: true, note: null, sortOrder: 1 },
  { key: 'card', label: 'Card', enabled: false, note: 'Coming soon', sortOrder: 2 },
]

const LABELS = { ecocash: 'EcoCash', crypto: 'Crypto', card: 'Card' }

function sortMethods(methods) {
  return [...methods].sort((a, b) => {
    const ae = a.enabled ? 0 : 1
    const be = b.enabled ? 0 : 1
    if (ae !== be) return ae - be
    const as = Number(a.sortOrder ?? 0)
    const bs = Number(b.sortOrder ?? 0)
    if (as !== bs) return as - bs
    return String(a.key).localeCompare(String(b.key))
  })
}

export function usePaymentMethods({ initialSelected = 'ecocash' } = {}) {
  const [methods, setMethods] = useState(DEFAULT_METHODS)
  const [selected, setSelected] = useState(initialSelected)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSelected(initialSelected)
  }, [initialSelected])

  useEffect(() => {
    let cancelled = false

    async function fetchPaymentMethods() {
      try {
        const res = await fetch('/api/payment-methods')
        const data = await res.json().catch(() => null)
        if (!res.ok) return

        const apiMethods = (data?.methods || []).map((m) => ({
          key: m.key,
          label: LABELS[m.key] || m.key,
          enabled: Boolean(m.enabled),
          note: m.note || null,
          sortOrder: Number(m.sortOrder ?? 0),
        }))

        const sorted = sortMethods(apiMethods)
        if (!cancelled && sorted.length) {
          setMethods(sorted)

          const current = sorted.find((x) => x.key === selected)
          if (current && !current.enabled) {
            const firstEnabled = sorted.find((x) => x.enabled)
            if (firstEnabled) setSelected(firstEnabled.key)
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    fetchPaymentMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedMethod = useMemo(() => methods.find((m) => m.key === selected) || null, [methods, selected])

  return { methods, selected, setSelected, selectedMethod, loaded }
}
