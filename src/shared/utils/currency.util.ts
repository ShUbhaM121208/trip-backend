/**
 * Currency Utility Functions
 * Handles currency formatting, conversion, and validation
 */

// Mock exchange rates (relative to USD)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CAD: 1.35,
  AUD: 1.52,
  INR: 83.12,
};

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

/**
 * Format currency amount with symbol
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    INR: '₹',
  };

  const symbol = symbols[currency.toUpperCase()] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get supported currencies
 * @returns Array of currency codes
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

/**
 * Validate if currency is supported
 * @param currency - Currency code to validate
 * @returns True if supported
 */
export function isSupportedCurrency(currency: string): boolean {
  return currency.toUpperCase() in EXCHANGE_RATES;
}

/**
 * Get exchange rate for a currency pair
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Exchange rate
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }

  return toRate / fromRate;
}
