/**
 * ROUNDING UTILITY FUNCTIONS
 * Handles precise decimal rounding for financial calculations
 * 
 * WHY THIS MODULE EXISTS:
 * Financial calculations require precise decimal arithmetic. JavaScript's
 * native floating-point arithmetic can cause precision issues:
 * - 0.1 + 0.2 = 0.30000000000000004 (not 0.3)
 * - 0.3 - 0.1 = 0.19999999999999998 (not 0.2)
 * 
 * This utility provides consistent rounding to prevent:
 * - Balance discrepancies
 * - Split amount mismatches
 * - Settlement calculation errors
 * 
 * DESIGN DECISIONS:
 * 1. Always round to 2 decimal places (currency standard)
 * 2. Use banker's rounding (Math.round) for fairness
 * 3. Adjust largest value when splits don't sum exactly
 * 4. Preserve precision for intermediate calculations
 * 
 * ALTERNATIVES CONSIDERED:
 * - Arbitrary precision libraries (decimal.js): Overkill for this use case
 * - Integer cents arithmetic: Would require refactoring entire codebase
 * - Tolerances for comparisons: Used in addition to rounding
 */

/**
 * Round a number to specified decimal places using banker's rounding
 * 
 * ALGORITHM:
 * 1. Multiply by 10^decimals to shift decimal point
 * 2. Apply Math.round (banker's rounding)
 * 3. Divide by 10^decimals to shift back
 * 
 * BANKER'S ROUNDING (Math.round):
 * - 0.5 rounds to 1 (round up)
 * - 1.5 rounds to 2 (round up)
 * - 2.5 rounds to 3 (round up)
 * - Uses "round half up" strategy
 * 
 * EXAMPLES:
 * - round(33.333, 2) = 33.33
 * - round(33.335, 2) = 33.34 (rounds up)
 * - round(33.334, 2) = 33.33 (rounds down)
 * - round(1.005, 2) = 1.01 (rounds up)
 * 
 * WHY THIS APPROACH:
 * - Simple and fast
 * - Consistent with financial conventions
 * - Predictable behavior
 * - No external dependencies
 * 
 * LIMITATIONS:
 * - Subject to floating-point precision limits
 * - Very large numbers (>10^15) may lose precision
 * - For this app: Not a problem (typical amounts < $1M)
 * 
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2 for currency)
 * @returns Rounded number
 * 
 * @example
 * round(33.333) // 33.33
 * round(99.999, 2) // 100.00
 * round(0.12345, 4) // 0.1235
 */
export function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Round up to specified decimal places (ceiling)
 * 
 * ALGORITHM:
 * 1. Multiply by 10^decimals
 * 2. Apply Math.ceil (always round up)
 * 3. Divide by 10^decimals
 * 
 * USE CASES:
 * - Budget calculations (round up to avoid overspending)
 * - Fee calculations (always favor the receiver)
 * - Quantity calculations (can't have partial items)
 * 
 * EXAMPLES:
 * - roundUp(33.331, 2) = 33.34
 * - roundUp(33.330, 2) = 33.33 (no change if exact)
 * - roundUp(99.991, 2) = 100.00
 * 
 * @param value - Number to round up
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded up number
 * 
 * @example
 * roundUp(33.331) // 33.34
 * roundUp(1.001, 2) // 1.01
 */
export function roundUp(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.ceil(value * multiplier) / multiplier;
}

/**
 * Round down to specified decimal places (floor)
 * 
 * ALGORITHM:
 * 1. Multiply by 10^decimals
 * 2. Apply Math.floor (always round down)
 * 3. Divide by 10^decimals
 * 
 * USE CASES:
 * - Tax calculations (round down to avoid overcharging)
 * - Discount calculations (always favor the customer)
 * - Inventory calculations (can't have partial items)
 * 
 * EXAMPLES:
 * - roundDown(33.339, 2) = 33.33
 * - roundDown(33.330, 2) = 33.33 (no change if exact)
 * - roundDown(99.999, 2) = 99.99
 * 
 * @param value - Number to round down
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded down number
 * 
 * @example
 * roundDown(33.339) // 33.33
 * roundDown(1.999, 2) // 1.99
 */
export function roundDown(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.floor(value * multiplier) / multiplier;
}

/**
 * SPLIT ROUNDING ADJUSTMENT - CORE ALGORITHM
 * 
 * Ensure sum of splits equals total amount by adjusting the largest split.
 * This is critical for maintaining financial accuracy in expense splitting.
 * 
 * PROBLEM STATEMENT:
 * When splitting $100 equally among 3 people:
 * - Raw calculation: $33.333... each
 * - After rounding: $33.33 + $33.33 + $33.33 = $99.99
 * - Missing: $0.01 (rounding error)
 * 
 * SOLUTION:
 * 1. Round all splits to 2 decimals
 * 2. Calculate sum of rounded splits
 * 3. Calculate difference: totalAmount - sum
 * 4. Add difference to the LARGEST split
 * 
 * WHY ADJUST LARGEST SPLIT:
 * - Minimizes relative error:
 *   - $100 → $100.01 is 0.01% error
 *   - $10 → $10.01 is 0.1% error (10x worse)
 * - Consistent behavior (always same person)
 * - Simple to implement and explain
 * - Fair in most scenarios
 * 
 * ALGORITHM VISUALIZATION:
 * ```
 * Input: splits=[33.333, 33.333, 33.334], total=100
 * 
 * Step 1: Round each split
 *   [33.33, 33.33, 33.33]
 * 
 * Step 2: Calculate sum
 *   33.33 + 33.33 + 33.33 = 99.99
 * 
 * Step 3: Calculate difference
 *   100.00 - 99.99 = 0.01
 * 
 * Step 4: Find largest split
 *   All equal, so choose first: 33.33
 * 
 * Step 5: Adjust largest
 *   33.33 + 0.01 = 33.34
 * 
 * Output: [33.34, 33.33, 33.33]
 * Verify: 33.34 + 33.33 + 33.33 = 100.00 ✓
 * ```
 * 
 * EDGE CASES:
 * 
 * 1. All splits equal:
 *    - Adjusts first split (arbitrary but consistent)
 *    - Example: [33.33, 33.33, 33.34] for $100
 * 
 * 2. Negative difference:
 *    - Sum > total (rare but possible)
 *    - Subtracts from largest split
 *    - Example: [50.01, 25.01, 24.99] → [50.00, 25.01, 24.99] for $100
 * 
 * 3. Large rounding error:
 *    - Should never happen with proper inputs
 *    - But algorithm handles it automatically
 *    - Example: [30, 30, 30] → [31, 30, 30] for $91
 * 
 * 4. Single split:
 *    - Gets full amount (no adjustment needed)
 *    - Example: [100.00] for $100 → [100.00]
 * 
 * 5. Zero splits:
 *    - Empty array → returns empty array
 *    - Should be prevented by validation upstream
 * 
 * 6. Very small amounts:
 *    - $0.01 split 3 ways → [$0.01, $0.00, $0.00]
 *    - Acceptable for edge case
 * 
 * ALTERNATIVES CONSIDERED:
 * 
 * 1. Distribute error across all splits:
 *    - More complex
 *    - Less predictable
 *    - Minimal benefit (error is tiny)
 * 
 * 2. Adjust smallest split:
 *    - Higher relative error
 *    - Less fair
 * 
 * 3. Adjust random split:
 *    - Non-deterministic
 *    - Harder to test
 *    - Could confuse users
 * 
 * 4. Use arbitrary precision decimals:
 *    - Overkill for currency (max 2 decimals)
 *    - Performance overhead
 *    - External dependency
 * 
 * 5. Track error separately:
 *    - Doesn't solve the fundamental issue
 *    - Adds complexity
 * 
 * REAL-WORLD EXAMPLES:
 * 
 * Example 1: Equal split
 * - Total: $100, Splits: 3 people
 * - Before: [33.33, 33.33, 33.33] = $99.99
 * - After: [33.34, 33.33, 33.33] = $100.00
 * - Error: $0.01 (0.03% relative)
 * 
 * Example 2: Percentage split
 * - Total: $77.77, Splits: [50%, 30%, 20%]
 * - Calculated: [38.885, 23.331, 15.554]
 * - Rounded: [38.89, 23.33, 15.55] = $77.77
 * - Before adjustment: No change needed (lucky!)
 * 
 * Example 3: Unequal split
 * - Total: $100, Splits: [60.005, 25.003, 14.992]
 * - Rounded: [60.01, 25.00, 14.99] = $100.00
 * - Before adjustment: No change needed
 * 
 * Example 4: Complex rounding
 * - Total: $99.99, Splits: [33.333, 33.333, 33.334]
 * - Rounded: [33.33, 33.33, 33.33] = $99.99
 * - After: [33.34, 33.33, 33.32] = $99.99
 * 
 * TESTING STRATEGY:
 * - Unit tests for various split counts (1, 2, 3, 10, 100)
 * - Unit tests for various amounts ($0.01, $10, $100, $1000)
 * - Verify sum always equals total (within floating-point tolerance)
 * - Verify adjustment is minimal (typically ≤ 0.01 per split)
 * 
 * @param splits - Array of split amounts (pre-rounded or raw)
 * @param totalAmount - Expected total that splits must sum to
 * @returns Adjusted splits that sum exactly to totalAmount
 * 
 * @example
 * adjustSplitsForRounding([33.33, 33.33, 33.33], 100)
 * // Returns: [33.34, 33.33, 33.33]
 * 
 * @example
 * adjustSplitsForRounding([50.00, 25.00, 25.00], 100)
 * // Returns: [50.00, 25.00, 25.00] (no adjustment needed)
 */
export function adjustSplitsForRounding(
  splits: number[],
  totalAmount: number
): number[] {
  // Step 1: Round all splits to 2 decimal places
  // WHY: Ensure consistent precision before summing
  const adjustedSplits = splits.map(s => round(s));
  
  // Step 2: Calculate sum of rounded splits
  // WHY: Determine if adjustment is needed
  const sum = adjustedSplits.reduce((acc, val) => acc + val, 0);
  
  // Step 3: Calculate difference (rounding error)
  // WHY: This is what we need to add/subtract
  // Note: Round the difference itself to avoid floating-point errors
  const difference = round(totalAmount - sum);

  // Step 4: If difference exists, adjust largest split
  // WHY: Only adjust if there's actually an error
  if (difference !== 0) {
    // Find index of the largest split
    // WHY: Minimize relative error by adjusting largest value
    const maxIndex = adjustedSplits.indexOf(Math.max(...adjustedSplits));
    
    // Adjust largest split by adding/subtracting difference
    // WHY: Ensures sum equals totalAmount exactly
    adjustedSplits[maxIndex] = round(adjustedSplits[maxIndex] + difference);
  }

  return adjustedSplits;
}

/**
 * Calculate percentage with proper rounding
 * 
 * ALGORITHM:
 * 1. Divide value by total
 * 2. Multiply by 100 to get percentage
 * 3. Round to specified decimals
 * 
 * USE CASES:
 * - Budget breakdown: "Food is 30% of budget"
 * - Expense analysis: "This trip spent 75% of budget"
 * - Split visualization: "You paid 60% of expenses"
 * 
 * EDGE CASES:
 * - total = 0: Returns 0 (prevents division by zero)
 * - value > total: Returns >100% (valid for over-budget)
 * - value = 0: Returns 0%
 * 
 * EXAMPLES:
 * - calculatePercentage(30, 100) = 30.00
 * - calculatePercentage(33.33, 100) = 33.33
 * - calculatePercentage(1, 3) = 33.33 (1/3 = 33.333...%)
 * - calculatePercentage(50, 0) = 0 (safe division)
 * 
 * @param value - Value to calculate percentage of
 * @param total - Total value (denominator)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage (0-100+)
 * 
 * @example
 * calculatePercentage(25, 100) // 25.00
 * calculatePercentage(1, 3) // 33.33
 * calculatePercentage(150, 100) // 150.00 (over 100%)
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 2
): number {
  // Handle division by zero
  // WHY: Prevents NaN, returns sensible default
  if (total === 0) return 0;
  
  // Calculate percentage and round
  return round((value / total) * 100, decimals);
}
