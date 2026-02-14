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
