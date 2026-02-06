/**
 * Rounding Utility Functions
 * Handles precise decimal rounding for financial calculations
 */

/**
 * Round a number to specified decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Round up to specified decimal places
 * @param value - Number to round up
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded up number
 */
export function roundUp(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.ceil(value * multiplier) / multiplier;
}

/**
 * Round down to specified decimal places
 * @param value - Number to round down
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded down number
 */
export function roundDown(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.floor(value * multiplier) / multiplier;
}

/**
 * Ensure sum of splits equals total amount by adjusting the largest split
 * Used to handle rounding errors in expense splits
 * @param splits - Array of split amounts
 * @param totalAmount - Expected total
 * @returns Adjusted splits
 */
export function adjustSplitsForRounding(
  splits: number[],
  totalAmount: number
): number[] {
  const adjustedSplits = splits.map(s => round(s));
  const sum = adjustedSplits.reduce((acc, val) => acc + val, 0);
  const difference = round(totalAmount - sum);

  if (difference !== 0) {
    // Find the index of the largest split and adjust it
    const maxIndex = adjustedSplits.indexOf(Math.max(...adjustedSplits));
    adjustedSplits[maxIndex] = round(adjustedSplits[maxIndex] + difference);
  }

  return adjustedSplits;
}

/**
 * Calculate percentage with proper rounding
 * @param value - Value to calculate percentage of
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 2
): number {
  if (total === 0) return 0;
  return round((value / total) * 100, decimals);
}
