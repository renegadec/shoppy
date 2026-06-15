export function normalizeZwMsisdn(input) {
  // Accepts: 0773..., 773..., 263773..., +263773...
  // Returns: 263773... (digits only) or null if empty
  const raw = String(input || '').trim()
  if (!raw) return null

  // Keep digits only
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null

  // Already in 263 format
  if (digits.startsWith('263')) return digits

  // Local starting with 0 (e.g. 0773...)
  if (digits.startsWith('0')) return `263${digits.slice(1)}`

  // If they start with 7 (e.g. 773...), assume Zimbabwe mobile without leading 0
  if (digits.startsWith('7')) return `263${digits}`

  // Fallback: return digits (better than losing data), but caller may validate length.
  return digits
}

const NETWORK_MAP = [
  { prefixes: ['77', '78'], id: 'econet', label: 'Econet' },
  { prefixes: ['71'], id: 'netone', label: 'NetOne' },
  { prefixes: ['73'], id: 'telecel', label: 'Telecel' },
]

export function detectZwNetwork(input) {
  const normalized = normalizeZwMsisdn(input)
  if (!normalized) return null

  // Get the local digits (after country code 263)
  const local = normalized.startsWith('263') ? normalized.slice(3) : normalized

  for (const n of NETWORK_MAP) {
    if (n.prefixes.some((p) => local.startsWith(p))) {
      return { id: n.id, label: n.label }
    }
  }

  return null
}

export function validateZwMsisdn(input) {
  const raw = String(input || '').trim()
  if (!raw) return { valid: false, error: 'Phone number is required' }

  const normalized = normalizeZwMsisdn(raw)
  if (!normalized) return { valid: false, error: 'Enter a valid phone number' }

  // Local part should be exactly 9 digits (e.g. 771234567 from 0771234567)
  const local = normalized.startsWith('263') ? normalized.slice(3) : normalized
  if (local.length !== 9) {
    return { valid: false, error: 'Number must be 10 digits (e.g. 077xxxxxxx)' }
  }

  const network = detectZwNetwork(raw)
  if (!network) {
    return { valid: false, error: 'Unknown network. Use an Econet, NetOne, or Telecel number.' }
  }

  return { valid: true, network: network.id, networkLabel: network.label, normalized }
}
