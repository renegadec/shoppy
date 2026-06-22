/**
 * Currency constants and helpers for multi-currency support (USD + ZiG).
 *
 * EcoCash accepts: "USD" or "ZWG" (ZiG's ISO 4217 code).
 * Hot Recharge uses separate product IDs per currency.
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'USD', symbol: '$' },
  { code: 'ZWG', label: 'ZiG', symbol: 'ZiG' },
]

export const DEFAULT_CURRENCY = 'USD'

/** EcoCash currency → Hot product ID map for airtime. */
const AIRTIME_PRODUCT_MAP = {
  USD: {
    econet: 101,
    netone: 100, // generic "Airtime USD" for NetOne
    telecel: 103,
  },
  ZWG: {
    econet: 7,
    telecel: 6,
    // netone is intentionally absent — Product 110 (Airtime ZiG for NetOne)
    // is not activated on the Hot Recharge account.
  },
}

/** Hot ZESA product ID (ZiG-only on Hot's side). */
export const HOT_ZESA_PRODUCT_ID = 24

/**
 * Get the Hot Recharge product ID for airtime given network + currency.
 * Returns null when no matching product exists for the exact currency.
 * Does NOT fall through to the USD product when ZWG is requested —
 * that would deliver USD airtime against a ZWG-priced order, which
 * is wrong.
 */
export function hotProductId(network, currency = 'USD') {
  const n = String(network || '').toLowerCase()
  const cur = currency === 'ZWG' ? 'ZWG' : 'USD'
  return AIRTIME_PRODUCT_MAP[cur]?.[n] ?? null
}

/**
 * Return a user-facing label for a supported currency code.
 */
export function currencyLabel(code) {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code)
  return found?.label || code
}

/**
 * Return the currency symbol for display.
 */
export function currencySymbol(code) {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code)
  return found?.symbol || code
}
