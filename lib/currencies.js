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
    netone: 110, // generic "Airtime ZiG" for NetOne
    telecel: 6,
  },
}

/** Hot ZESA product ID (ZiG-only on Hot's side). */
export const HOT_ZESA_PRODUCT_ID = 24

/**
 * Get the Hot Recharge product ID for airtime given network + currency.
 * Falls back to the USD product if the currency isn't mapped.
 */
export function hotProductId(network, currency = 'USD') {
  const n = String(network || '').toLowerCase()
  const cur = currency === 'ZWG' ? 'ZWG' : 'USD'
  return AIRTIME_PRODUCT_MAP[cur]?.[n] || AIRTIME_PRODUCT_MAP['USD']?.[n] || null
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
