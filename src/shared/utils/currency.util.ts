/**
 * CURRENCY UTILITY FUNCTIONS
 * Handles currency formatting, conversion, and validation
 * 
 * WHY THIS MODULE EXISTS:
 * Trip Companion supports multi-currency expenses where:
 * - Trip has a base currency (e.g., USD)
 * - Expenses can be in different currencies (e.g., EUR, JPY)
 * - Balances must be calculated in base currency
 * - Settlements must be in base currency
 * 
 * CURRENT LIMITATIONS:
 * - Uses static exchange rates (not real-time)
 * - Supports only 7 currencies
 * - No historical rate tracking
 * - No rate update mechanism
 * 
 * FUTURE ENHANCEMENTS:
 * - Integrate with exchange rate API (e.g., fixer.io, exchangerate-api.com)
 * - Support all ISO 4217 currencies (~180 total)
 * - Cache rates with TTL (refresh hourly/daily)
 * - Track historical rates for trip duration
 * - Allow manual rate override per expense
 * - Support cryptocurrency (BTC, ETH)
 */

/**
 * MOCK EXCHANGE RATES
 * 
 * All rates are relative to USD (1.0 = base).
 * Rates are approximations and should be replaced with real-time data.
 * 
 * CONVERSION FORMULA:
 * To convert from Currency A to Currency B:
 * 1. Convert A to USD: amountUSD = amountA / rateA
 * 2. Convert USD to B: amountB = amountUSD * rateB
 * 
 * EXAMPLE:
 * Convert 100 EUR to JPY:
 * 1. 100 EUR to USD: 100 / 0.92 = 108.70 USD
 * 2. 108.70 USD to JPY: 108.70 * 149.50 = 16,251 JPY
 * 
 * SUPPORTED CURRENCIES:
 * - USD: United States Dollar (base)
 * - EUR: Euro
 * - GBP: British Pound Sterling
 * - JPY: Japanese Yen
 * - CAD: Canadian Dollar
 * - AUD: Australian Dollar
 * - INR: Indian Rupee
 * 
 * WHY THESE CURRENCIES:
 * - Cover major global travel destinations
 * - Represent different currency strengths
 * - Include both decimal and non-decimal currencies (JPY)
 * - Commonly used in international travel
 * 
 * RATE SOURCES (for reference):
 * - Rates as of February 2026 (approximate)
 * - Based on major forex markets
 * - Should be updated quarterly at minimum
 * 
 * FUTURE: Replace with API
 * ```typescript
 * const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
 * const rates = await response.json();
 * EXCHANGE_RATES = rates.rates;
 * ```
 */
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,      // Base currency
  EUR: 0.92,     // 1 USD = 0.92 EUR (or 1 EUR = 1.087 USD)
  GBP: 0.79,     // 1 USD = 0.79 GBP (or 1 GBP = 1.266 USD)
  JPY: 149.50,   // 1 USD = 149.50 JPY (or 1 JPY = 0.0067 USD)
  CAD: 1.35,     // 1 USD = 1.35 CAD (or 1 CAD = 0.741 USD)
  AUD: 1.52,     // 1 USD = 1.52 AUD (or 1 AUD = 0.658 USD)
  INR: 83.12,    // 1 USD = 83.12 INR (or 1 INR = 0.012 USD)
};

/**
 * CONVERT CURRENCY
 * 
 * Converts an amount from one currency to another using exchange rates.
 * All conversions go through USD as the base currency.
 * 
 * ALGORITHM:
 * 1. If fromCurrency === toCurrency, return amount (no conversion)
 * 2. Convert fromCurrency to USD: amountUSD = amount / fromRate
 * 3. Convert USD to toCurrency: result = amountUSD * toRate
 * 
 * CONVERSION PATH:
 * ```
 * EUR → USD → JPY
 * 100 EUR → 108.70 USD → 16,251 JPY
 * ```
 * 
 * WHY THROUGH USD:
 * - Simplifies rate management (N rates instead of N²)
 * - Standard practice in forex markets
 * - Easier to update and maintain
 * 
 * PRECISION:
 * - No rounding applied here
 * - Caller should round based on use case
 * - Balance calculations round to 2 decimals
 * - Display formatting can use different precision
 * 
 * EXAMPLES:
 * 
 * Example 1: EUR to USD
 * - convertCurrency(100, 'EUR', 'USD')
 * - 100 / 0.92 = 108.70 USD
 * 
 * Example 2: USD to JPY
 * - convertCurrency(100, 'USD', 'JPY')
 * - 100 * 149.50 = 14,950 JPY
 * 
 * Example 3: EUR to JPY (through USD)
 * - convertCurrency(100, 'EUR', 'JPY')
 * - Step 1: 100 / 0.92 = 108.70 USD
 * - Step 2: 108.70 * 149.50 = 16,251 JPY
 * 
 * Example 4: Same currency
 * - convertCurrency(100, 'USD', 'USD')
 * - Returns 100 (no conversion)
 * 
 * EDGE CASES:
 * - Same currency: Returns input (fast path)
 * - Unsupported currency: Throws error
 * - Zero amount: Returns 0 (valid)
 * - Negative amount: Returns negative (valid for refunds)
 * 
 * ERROR HANDLING:
 * - Throws error for unsupported currencies
 * - Case-insensitive currency codes (USD = usd = Usd)
 * - Clear error messages for debugging
 * 
 * FUTURE ENHANCEMENTS:
 * - Add date parameter for historical rates
 * - Support rate override per conversion
 * - Cache conversion results with TTL
 * - Add conversion metadata (rate, timestamp)
 * 
 * @param amount - Amount to convert (can be negative for refunds)
 * @param fromCurrency - Source currency code (ISO 4217)
 * @param toCurrency - Target currency code (ISO 4217)
 * @returns Converted amount (unrounded)
 * @throws Error if currency is not supported
 * 
 * @example
 * convertCurrency(100, 'USD', 'EUR') // 92.00
 * convertCurrency(100, 'EUR', 'USD') // 108.70
 * convertCurrency(100, 'GBP', 'JPY') // 18,924
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // Fast path: same currency, no conversion needed
  // WHY: Avoid unnecessary calculations and floating-point errors
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Normalize currency codes to uppercase
  // WHY: Exchange rates map is case-sensitive
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()];

  // Validate currencies are supported
  // WHY: Fail fast with clear error message
  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }

  // Step 1: Convert to USD (base currency)
  // WHY: All rates are relative to USD
  const amountInUSD = amount / fromRate;
  
  // Step 2: Convert from USD to target currency
  // WHY: Complete the two-step conversion
  return amountInUSD * toRate;
}

/**
 * FORMAT CURRENCY
 * 
 * Formats an amount with currency symbol and 2 decimal places.
 * Used for display purposes in UI and logs.
 * 
 * FORMAT: `{symbol}{amount}`
 * Examples: $100.00, €92.00, £79.00, ¥14950.00
 * 
 * PRECISION:
 * - Always 2 decimal places (even for JPY which doesn't use decimals)
 * - Use Math.toFixed(2) for consistent formatting
 * 
 * SYMBOLS:
 * - USD: $ (dollar sign)
 * - EUR: € (euro sign)
 * - GBP: £ (pound sign)
 * - JPY: ¥ (yen sign)
 * - CAD: CA$ (Canadian dollar)
 * - AUD: A$ (Australian dollar)
 * - INR: ₹ (rupee sign)
 * 
 * WHY THESE SYMBOLS:
 * - Standard currency symbols
 * - Widely recognized internationally
 * - Supported in UTF-8 encoding
 * 
 * LOCALIZATION:
 * Current: Fixed format (symbol before amount)
 * Future: Use Intl.NumberFormat for proper localization
 * ```typescript
 * new Intl.NumberFormat('en-US', {
 *   style: 'currency',
 *   currency: 'USD'
 * }).format(amount)
 * ```
 * 
 * EXAMPLES:
 * - formatCurrency(100, 'USD') → "$100.00"
 * - formatCurrency(92.5, 'EUR') → "€92.50"
 * - formatCurrency(14950, 'JPY') → "¥14950.00"
 * - formatCurrency(0.99, 'GBP') → "£0.99"
 * 
 * EDGE CASES:
 * - Unknown currency: Returns "CODE100.00" (currency code as symbol)
 * - Negative amount: Returns "$-100.00"
 * - Zero: Returns "$0.00"
 * - Very large: Returns "$1000000.00" (no thousands separator yet)
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (ISO 4217)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(100, 'USD') // "$100.00"
 * formatCurrency(92.5, 'EUR') // "€92.50"
 */
export function formatCurrency(amount: number, currency: string): string {
  // Currency symbol mapping
  // WHY: Provide user-friendly display symbols
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    INR: '₹',
  };

  // Get symbol or fallback to currency code
  // WHY: Always display something, even for unknown currencies
  const symbol = symbols[currency.toUpperCase()] || currency;
  
  // Format with 2 decimal places
  // WHY: Standard currency precision
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * GET SUPPORTED CURRENCIES
 * 
 * Returns array of all supported currency codes.
 * Used for:
 * - Populating currency dropdowns in UI
 * - Validating user input
 * - API documentation
 * 
 * @returns Array of currency codes (ISO 4217)
 * 
 * @example
 * getSupportedCurrencies()
 * // ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR']
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

/**
 * VALIDATE CURRENCY SUPPORT
 * 
 * Checks if a currency code is supported.
 * Case-insensitive validation.
 * 
 * USE CASES:
 * - Input validation before conversion
 * - API parameter validation
 * - UI dropdown population
 * 
 * EXAMPLES:
 * - isSupportedCurrency('USD') → true
 * - isSupportedCurrency('usd') → true (case-insensitive)
 * - isSupportedCurrency('BTC') → false (not supported)
 * - isSupportedCurrency('') → false (empty string)
 * 
 * @param currency - Currency code to validate
 * @returns True if supported, false otherwise
 * 
 * @example
 * isSupportedCurrency('USD') // true
 * isSupportedCurrency('XYZ') // false
 */
export function isSupportedCurrency(currency: string): boolean {
  return currency.toUpperCase() in EXCHANGE_RATES;
}

/**
 * GET EXCHANGE RATE
 * 
 * Returns the exchange rate for a currency pair.
 * Does not perform conversion, just returns the rate.
 * 
 * FORMULA:
 * rate = toRate / fromRate
 * 
 * EXAMPLES:
 * - getExchangeRate('USD', 'EUR') → 0.92 (1 USD = 0.92 EUR)
 * - getExchangeRate('EUR', 'USD') → 1.087 (1 EUR = 1.087 USD)
 * - getExchangeRate('USD', 'USD') → 1.0 (same currency)
 * 
 * USE CASES:
 * - Display rate to user before conversion
 * - Log rate for audit trail
 * - Calculate reverse conversion
 * - Compare rates over time
 * 
 * PRECISION:
 * - Returns raw rate (many decimals)
 * - Caller should round for display
 * 
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Exchange rate (how many toCurrency per 1 fromCurrency)
 * @throws Error if currency is not supported
 * 
 * @example
 * getExchangeRate('USD', 'EUR') // 0.92
 * getExchangeRate('GBP', 'JPY') // 189.24 (149.5 / 0.79)
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  // Same currency: rate is 1.0
  // WHY: 1 USD = 1 USD, no conversion needed
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  // Get rates from map
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()];

  // Validate currencies
  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }

  // Calculate exchange rate
  // FORMULA: toRate / fromRate
  // EXAMPLE: EUR to JPY = 149.5 / 0.92 = 162.5
  //          This means 1 EUR = 162.5 JPY
  return toRate / fromRate;
}
