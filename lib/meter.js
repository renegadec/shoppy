export function normalizeMeterNumber(input) {
  // Remove spaces/dashes and keep digits only.
  return String(input || '').replace(/\D/g, '')
}
