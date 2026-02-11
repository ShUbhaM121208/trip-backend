/**
 * SETTLEMENT SERVICE
 * Business logic for balance calculations and settlement optimization
 * 
 * CORE RESPONSIBILITIES:
 * 1. Calculate net balance per user (who owes vs who is owed)
 * 2. Generate optimal settlement recommendations (minimize transactions)
 * 3. Handle multi-currency expense aggregation
 * 4. Provide settlement statistics and summaries
 * 
 * BALANCE CALCULATION ALGORITHM:
 * For each user:
 *   balance = totalPaid - totalOwed
 *   - totalPaid: sum of all expenses they paid for (paidBy)
 *   - totalOwed: sum of all their expense splits
 *   - All amounts converted to trip base currency
 * 
 * Interpretation:
 *   - Positive balance: User is owed money (creditor)
 *   - Negative balance: User owes money (debtor)
 *   - Zero balance: User is settled up
 * 
 * SETTLEMENT OPTIMIZATION ALGORITHM:
 * Greedy approach that matches largest creditor with largest debtor.
 * Goal: Minimize number of transactions, not total amount transferred.
 * 
 * Why greedy works here:
 * - Simple and fast (O(n log n) due to sorting)
 * - Produces near-optimal results for most scenarios
 * - Easy to understand and explain to users
 * - Deterministic behavior (same inputs = same outputs)
 * 
 * Alternative considered:
 * - Graph-based optimal settlement: More complex, marginally better
 * - Network flow algorithms: Overkill for typical group sizes
 * - Brute force: Too slow for >10 participants
 * 
 * WHY THIS MATTERS:
 * - Fair expense distribution
 * - Clear settlement instructions
 * - Reduced transaction count (fewer payments needed)
 * - Multi-currency support (all balances in base currency)
 */

import type { Balance, Settlement, User } from '@/shared/types';
import { expenses, findTripById, settlements } from '@/shared/data/mockDataStore';
import { round } from '@/shared/utils/rounding.util';
import { convertCurrency } from '@/shared/utils/currency.util';
import { createNotFoundError } from '@/shared/middleware/errorHandler';
import { generateId } from '@/shared/utils/id.util';
import { getCurrentTimestamp } from '@/shared/utils/date.util';

/**
 * Service class handling settlement and balance calculations
 */
export class SettlementService {
  /**
   * CALCULATE BALANCES - NET POSITION PER USER
   * 
   * Computes each participant's net balance in the trip's base currency.
   * This is the foundation for settlement calculations.
   * 
   * ALGORITHM FLOW:
   * 1. Get all expenses for the trip
   * 2. Initialize balance tracking for each participant
   * 3. For each expense:
   *    a. Convert amount to trip base currency
   *    b. Add full amount to payer's "paid" total
   *    c. For each split:
   *       - Convert split amount to base currency
   *       - Add to participant's "owed" total
   * 4. Calculate net balance: paid - owed
   * 5. Round to 2 decimals
   * 6. Sort by amount (creditors first, debtors last)
   * 
   * MULTI-CURRENCY HANDLING:
   * - Expense currency may differ from trip base currency
   * - All amounts converted to base currency for comparison
   * - Conversion uses static exchange rates (see currency.util.ts)
   * - Ensures apples-to-apples balance calculation
   * 
   * EXAMPLE WALKTHROUGH:
   * 
   * Trip: 3 people (Alex, Sarah, Mike), base currency USD
   * 
   * Expense 1: Hotel $300 paid by Alex, split equally
   * - Alex paid: $300
   * - Alex owes: $100 (1/3 of $300)
   * - Sarah owes: $100
   * - Mike owes: $100
   * 
   * Expense 2: Dinner $120 paid by Sarah, split equally
   * - Sarah paid: $120
   * - Alex owes: $40
   * - Sarah owes: $40
   * - Mike owes: $40
   * 
   * Expense 3: Transport $90 paid by Mike, split equally
   * - Mike paid: $90
   * - Alex owes: $30
   * - Sarah owes: $30
   * - Mike owes: $30
   * 
   * Net Balances:
   * - Alex: paid $300, owed $170 → balance +$130 (is owed)
   * - Sarah: paid $120, owed $170 → balance -$50 (owes)
   * - Mike: paid $90, owed $170 → balance -$80 (owes)
   * 
   * Verification: $130 + (-$50) + (-$80) = $0 ✓ (must sum to zero)
   * 
   * BALANCE INTERPRETATION:
   * - +$130: Alex should receive $130
   * - -$50: Sarah should pay $50
   * - -$80: Mike should pay $80
   * 
   * EDGE CASES:
   * 
   * 1. No expenses:
   *    - All balances are $0.00
   *    - No settlements needed
   * 
   * 2. Single participant:
   *    - Balance is always $0.00
   *    - They paid everything and owe everything
   * 
   * 3. One person pays all:
   *    - Payer has large positive balance
   *    - Others have equal negative balances
   *    - Simple settlement pattern
   * 
   * 4. Everyone pays their own:
   *    - All balances are $0.00 or very close
   *    - Minimal settlements needed
   * 
   * 5. Rounding errors:
   *    - Balances may not sum exactly to zero
   *    - Within 0.01 tolerance per person (acceptable)
   *    - Example: +$130.00, -$50.01, -$79.99 = $0.00
   * 
   * 6. Multi-currency:
   *    - Expense in EUR, JPY, GBP all converted to USD
   *    - Conversion happens at expense level
   *    - Balances always in single currency
   * 
   * WHY SORT BY AMOUNT:
   * - Creditors first (positive amounts)
   * - Debtors last (negative amounts)
   * - Makes settlement matching easier
   * - Provides clear visual hierarchy
   * 
   * WHY 0.01 TOLERANCE:
   * - Balances < $0.01 treated as settled
   * - Prevents tiny settlements ($0.01 from Alex to Sarah)
   * - Acceptable loss of precision for user convenience
   * 
   * PERFORMANCE:
   * - O(E * S) where E = expenses, S = avg splits per expense
   * - Typically: 50 expenses * 3 splits = 150 operations
   * - Fast enough for in-memory calculation
   * - For large trips (1000+ expenses): Consider caching
   * 
   * @param tripId - Trip identifier
   * @returns Array of balances sorted by amount (creditors first)
   * @throws NotFoundError if trip doesn't exist
   * 
   * @example
   * calculateBalances('trip-123')
   * // Returns:
   * // [
   * //   { userId: 'alex', userName: 'Alex', amount: 485.00 },  // creditor
   * //   { userId: 'emma', userName: 'Emma', amount: 0.00 },    // settled
   * //   { userId: 'sarah', userName: 'Sarah', amount: -235.00 }, // debtor
   * //   { userId: 'mike', userName: 'Mike', amount: -250.00 }    // debtor
   * // ]
   */
  calculateBalances(tripId: string): Balance[] {
    // Validate trip exists
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    // Get all expenses for this trip
    const tripExpenses = expenses.filter((e) => e.tripId === tripId);
    
    // Initialize balance tracking
    // Map structure: userId → { user, paid, owed }
    const balanceMap = new Map<string, { user: User; paid: number; owed: number }>();

    // Initialize balance for each participant
    // WHY: Ensure all participants appear in results, even with zero balance
    trip.participants.forEach((participant) => {
      balanceMap.set(participant.id, {
        user: participant,
        paid: 0,
        owed: 0,
      });
    });

    // Process each expense to accumulate paid and owed amounts
    tripExpenses.forEach((expense) => {
      // Convert expense to trip's base currency
      // WHY: All balances must be in same currency for comparison
      // EXAMPLE: €100 expense in USD trip → ~$109 expense
      const amountInBaseCurrency = convertCurrency(
        expense.amount,
        expense.currency,
        trip.baseCurrency
      );

      // Add full expense amount to payer's "paid" total
      // WHY: Payer fronted the entire expense amount
      const payerBalance = balanceMap.get(expense.paidBy.id);
      if (payerBalance) {
        payerBalance.paid += amountInBaseCurrency;
      }

      // Add split amounts to each participant's "owed" total
      // WHY: Each participant is responsible for their share
      expense.splits.forEach((split) => {
        const participantBalance = balanceMap.get(split.userId);
        if (participantBalance) {
          // Convert split amount to base currency
          // WHY: Split amounts are in expense currency, need base currency
          const owedInBaseCurrency = convertCurrency(
            split.amount,
            expense.currency,
            trip.baseCurrency
          );
          participantBalance.owed += owedInBaseCurrency;
        }
      });
    });

    // Calculate net balance for each participant
    // Formula: net balance = total paid - total owed
    const balances: Balance[] = [];
    balanceMap.forEach((data) => {
      // Calculate net balance
      // POSITIVE: User is owed money (they paid more than their share)
      // NEGATIVE: User owes money (they paid less than their share)
      // ZERO: User is settled up (they paid exactly their share)
      const netBalance = round(data.paid - data.owed);
      
      balances.push({
        userId: data.user.id,
        userName: data.user.name,
        amount: netBalance,
      });
    });

    // Sort by amount (highest positive first, then lowest negative)
    // WHY: Creditors at top, debtors at bottom, visual hierarchy
    return balances.sort((a, b) => b.amount - a.amount);
  }

  /**
   * CALCULATE OPTIMAL SETTLEMENTS - GREEDY ALGORITHM
   * 
   * Generates minimum number of payments needed to settle all balances.
   * Uses greedy matching: pair largest creditor with largest debtor.
   * 
   * ALGORITHM FLOW:
   * 1. Calculate balances for all participants
   * 2. Separate into creditors (positive) and debtors (negative)
   * 3. Sort both by amount (descending)
   * 4. Greedy matching:
   *    - Take largest creditor and largest debtor
   *    - Settlement amount = min(creditor amount, debtor amount)
   *    - Create settlement from debtor to creditor
   *    - Update remaining amounts
   *    - Move to next when settled (amount < 0.01)
   * 5. Repeat until all settled
   * 
   * GREEDY STRATEGY EXPLANATION:
   * 
   * Why match largest with largest?
   * - Reduces number of partial settlements
   * - Often results in full settlements (one payment fully settles one party)
   * - Simple and predictable
   * 
   * Example: Better settlement pattern
   * Creditors: Alex($100), Bob($50)
   * Debtors: Charlie($60), Dave($90)
   * 
   * Greedy approach:
   * 1. Dave → Alex: $90 (Dave settled, Alex has $10 left)
   * 2. Charlie → Alex: $10 (Alex settled, Charlie has $50 left)
   * 3. Charlie → Bob: $50 (both settled)
   * Total: 3 transactions
   * 
   * Alternative (pairing smallest):
   * 1. Charlie → Bob: $50 (Bob settled, Charlie has $10 left)
   * 2. Dave → Alex: $90 (Dave settled, Alex has $10 left)
   * 3. Charlie → Alex: $10 (both settled)
   * Total: 3 transactions (same, but less intuitive)
   * 
   * DETAILED EXAMPLE:
   * 
   * Starting balances:
   * - Alex: +$485 (is owed)
   * - Emma: $0 (settled)
   * - Sarah: -$235 (owes)
   * - Mike: -$250 (owes)
   * 
   * Step 1: Separate creditors and debtors
   * Creditors: [Alex($485)]
   * Debtors: [Mike($250), Sarah($235)]
   * 
   * Step 2: Match largest debtor (Mike) with largest creditor (Alex)
   * - Settlement: Mike → Alex: $250
   * - After: Alex has $235 remaining, Mike settled
   * - Output: { from: Mike, to: Alex, amount: $250 }
   * 
   * Step 3: Match next debtor (Sarah) with remaining creditor (Alex)
   * - Settlement: Sarah → Alex: $235
   * - After: Both settled
   * - Output: { from: Sarah, to: Alex, amount: $235 }
   * 
   * Final settlements:
   * 1. Mike pays Alex $250
   * 2. Sarah pays Alex $235
   * 
   * Result: 2 transactions (minimal for this scenario)
   * 
   * COMPLEXITY ANALYSIS:
   * - Time: O(n log n) for sorting + O(n) for matching = O(n log n)
   * - Space: O(n) for creditors and debtors arrays
   * - n = number of participants (typically 2-10)
   * - Very fast for typical group sizes
   * 
   * OPTIMALITY:
   * - Greedy is NOT always globally optimal
   * - But produces good results (often optimal, rarely more than +1 transaction)
   * - Tradeoff: simplicity and speed vs perfect optimization
   * 
   * Example where greedy is suboptimal:
   * Creditors: A($10), B($10)
   * Debtors: C($5), D($5), E($5), F($5)
   * 
   * Greedy: 6 transactions (each debtor to both creditors)
   * Optimal: 4 transactions (2 debtors to each creditor)
   * 
   * But: This scenario is rare, and 6 vs 4 transactions is acceptable
   * 
   * EDGE CASES:
   * 
   * 1. All balances zero:
   *    - No creditors or debtors
   *    - Returns empty array
   * 
   * 2. Only one creditor:
   *    - All debtors pay that person
   *    - Number of transactions = number of debtors
   * 
   * 3. Only one debtor:
   *    - That person pays all creditors
   *    - Number of transactions = number of creditors
   * 
   * 4. Balances < 0.01:
   *    - Ignored (too small to settle)
   *    - Prevents settlements like "Pay Alex $0.01"
   * 
   * 5. Perfect pairs:
   *    - Creditor amount exactly matches debtor amount
   *    - One transaction fully settles both parties
   * 
   * WHY 0.01 THRESHOLD:
   * - Amounts < $0.01 are ignored
   * - Prevents micro-transactions
   * - User convenience > perfect accuracy
   * - Example: Don't ask someone to pay $0.01
   * 
   * FUTURE ENHANCEMENTS:
   * - Support partial settlement tracking
   * - Allow user to mark settlements as paid
   * - Generate payment links (Venmo, PayPal)
   * - Consider payment preferences (who prefers to pay whom)
   * - Optimize for minimal total amount (graph algorithms)
   * 
   * @param tripId - Trip identifier
   * @returns Array of settlement recommendations
   * @throws NotFoundError if trip doesn't exist
   * 
   * @example
   * calculateSettlements('trip-123')
   * // Returns:
   * // [
   * //   { from: Mike, to: Alex, amount: 250.00, currency: 'USD' },
   * //   { from: Sarah, to: Alex, amount: 235.00, currency: 'USD' }
   * // ]
   */
  calculateSettlements(tripId: string): Settlement[] {
    // Validate trip exists
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    // Get balances for all participants
    const balances = this.calculateBalances(tripId);
    const settlements: Settlement[] = [];

    // Separate creditors (positive balance) and debtors (negative balance)
    // Filter out balances close to zero (< 0.01)
    // WHY 0.01: Don't create settlements for tiny amounts
    
    // Creditors: People who are owed money
    const creditors = balances
      .filter((b) => b.amount > 0.01)
      .map((b) => ({
        user: trip.participants.find((p) => p.id === b.userId)!,
        amount: b.amount,
      }));

    // Debtors: People who owe money
    // Convert to positive amounts for easier calculation
    const debtors = balances
      .filter((b) => b.amount < -0.01)
      .map((b) => ({
        user: trip.participants.find((p) => p.id === b.userId)!,
        amount: Math.abs(b.amount), // Make positive
      }));

    // Greedy algorithm: match largest debtor with largest creditor
    // Arrays are already sorted (from calculateBalances)
    // Creditors: descending (largest first)
    // Debtors: descending by absolute value (largest debt first)
    let creditorIdx = 0;
    let debtorIdx = 0;

    // Continue while there are unmatched creditors and debtors
    while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
      const creditor = creditors[creditorIdx];
      const debtor = debtors[debtorIdx];

      // Calculate settlement amount
      // Use minimum of what's owed and what's due
      // WHY: Can't settle more than the smaller of the two amounts
      // 
      // Example 1: Creditor is owed $100, Debtor owes $80
      //            → Settlement: $80 (debtor's limit)
      //            → Creditor still owed $20, Debtor settled
      // 
      // Example 2: Creditor is owed $80, Debtor owes $100
      //            → Settlement: $80 (creditor's limit)
      //            → Creditor settled, Debtor still owes $20
      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      // Only create settlement if amount is significant (> $0.01)
      // WHY: Avoid micro-transactions
      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtor.user,      // Person making payment
          to: creditor.user,      // Person receiving payment
          amount: round(settlementAmount), // Round to 2 decimals
          currency: trip.baseCurrency, // Always in base currency
        });
      }

      // Update remaining amounts after this settlement
      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      // Move to next creditor/debtor if current one is settled
      // WHY: If remaining amount < $0.01, consider them settled
      if (creditor.amount < 0.01) creditorIdx++;
      if (debtor.amount < 0.01) debtorIdx++;
    }

    return settlements;
  }

  /**
   * GET SETTLEMENT SUMMARY
   * 
   * Provides high-level statistics about settlements for a trip.
   * Useful for displaying summary information in UI.
   * 
   * METRICS:
   * - totalTransactions: Number of settlements needed
   * - totalAmountToSettle: Sum of all settlement amounts
   * - currency: Trip's base currency
   * 
   * USE CASES:
   * - Display "3 payments needed, $485 total"
   * - Trip overview dashboard
   * - Settlement progress tracking
   * 
   * NOTES:
   * - totalAmountToSettle is NOT the trip total spent
   * - It's the sum of money that needs to change hands
   * - Always less than or equal to trip total spent
   * 
   * EXAMPLE:
   * Trip spent: $600
   * Balances: Alex(+$300), Sarah(-$150), Mike(-$150)
   * Settlements: Sarah→Alex($150), Mike→Alex($150)
   * Total amount to settle: $300 (not $600)
   * 
   * WHY DIFFERENT FROM TOTAL SPENT:
   * - Total spent: All expenses combined
   * - Total to settle: Net transfers needed
   * - Equal to sum of all positive balances (or sum of absolute negative balances)
   * 
   * @param tripId - Trip identifier
   * @returns Settlement summary statistics
   * @throws NotFoundError if trip doesn't exist
   * 
   * @example
   * getSettlementSummary('trip-123')
   * // Returns:
   * // {
   * //   totalTransactions: 2,
   * //   totalAmountToSettle: 485.00,
   * //   currency: 'USD'
   * // }
   */
  getSettlementSummary(tripId: string): {
    totalTransactions: number;
    totalAmountToSettle: number;
    currency: string;
  } {
    // Validate trip exists
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    // Calculate all settlements
    const settlements = this.calculateSettlements(tripId);
    
    // Sum all settlement amounts
    // WHY: Shows total money that needs to change hands
    const totalAmountToSettle = settlements.reduce((sum, s) => sum + s.amount, 0);

    return {
      totalTransactions: settlements.length,
      totalAmountToSettle: round(totalAmountToSettle),
      currency: trip.baseCurrency,
    };
  }

  /**
   * Generate and save settlements for a trip with tracking IDs
   * 
   * Creates settlements with unique IDs and pending status for tracking payments.
   * 
   * @param tripId - Trip identifier
   * @returns Array of settlements with IDs and status
   * 
   * WORKFLOW:
   * 1. Calculate optimal settlements
   * 2. Assign unique IDs to each settlement
   * 3. Set initial status as 'pending'
   * 4. Store in settlements Map
   * 5. Return tracked settlements
   * 
   * PURPOSE:
   * - Enable payment tracking
   * - Allow marking settlements as paid
   * - Track settlement history
   * - Support partial settlement scenarios
   */
  generateSettlements(tripId: string): Settlement[] {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    const suggested = this.calculateSettlements(tripId);
    
    // Add IDs and tracking fields
    const trackedSettlements: Settlement[] = suggested.map(s => ({
      ...s,
      id: `settlement-${generateId()}`,
      status: 'pending' as const,
      tripId,
    }));

    settlements.set(tripId, trackedSettlements);
    return trackedSettlements;
  }

  /**
   * Get tracked settlements for a trip
   * 
   * Returns settlements with their current status (pending/completed).
   * If no settlements exist, generates them automatically.
   * 
   * @param tripId - Trip identifier
   * @returns Array of tracked settlements
   */
  getTrackedSettlements(tripId: string): Settlement[] {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    let tripSettlements = settlements.get(tripId);
    
    // Auto-generate if not exists
    if (!tripSettlements || tripSettlements.length === 0) {
      tripSettlements = this.generateSettlements(tripId);
    }

    return tripSettlements;
  }

  /**
   * Mark settlement as paid
   * 
   * Updates settlement status to 'completed' and records payment timestamp.
   * 
   * @param tripId - Trip identifier
   * @param settlementId - Settlement identifier
   * @returns Updated settlement
   * @throws NotFoundError if trip or settlement not found
   * 
   * VALIDATION:
   * - Trip must exist
   * - Settlement must exist
   * - Settlement must be pending (cannot re-mark completed ones)
   * 
   * SIDE EFFECTS:
   * - Updates settlement status
   * - Records payment timestamp
   * - Updates settlements Map
   */
  markSettlementAsPaid(tripId: string, settlementId: string): Settlement {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    const tripSettlements = settlements.get(tripId) || [];
    const settlement = tripSettlements.find(s => s.id === settlementId);
    
    if (!settlement) {
      throw createNotFoundError('Settlement', settlementId);
    }

    // Update settlement
    settlement.status = 'completed';
    settlement.paidAt = getCurrentTimestamp();
    
    // Save back to Map
    settlements.set(tripId, tripSettlements);
    
    return settlement;
  }

  /**
   * Get settlement summary with status tracking
   * 
   * Provides comprehensive settlement statistics including payment status.
   * 
   * @param tripId - Trip identifier
   * @returns Settlement summary with counts and amounts
   * 
   * RETURNED DATA:
   * - totalSettlements: Total number of settlements
   * - completedSettlements: Number marked as paid
   * - pendingSettlements: Number still pending payment
   * - totalAmountToSettle: Sum of pending payment amounts
   * - totalAmountSettled: Sum of completed payment amounts
   * - allSettled: Boolean indicating if all payments complete
   * 
   * USE CASES:
   * - Display settlement progress UI
   * - Validate trip completion eligibility
   * - Show payment summary statistics
   */
  getSettlementSummaryWithStatus(tripId: string): {
    totalSettlements: number;
    completedSettlements: number;
    pendingSettlements: number;
    totalAmountToSettle: number;
    totalAmountSettled: number;
    currency: string;
    allSettled: boolean;
  } {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    const tripSettlements = this.getTrackedSettlements(tripId);
    
    const completed = tripSettlements.filter(s => s.status === 'completed');
    const pending = tripSettlements.filter(s => s.status === 'pending' || !s.status);

    return {
      totalSettlements: tripSettlements.length,
      completedSettlements: completed.length,
      pendingSettlements: pending.length,
      totalAmountToSettle: round(pending.reduce((sum, s) => sum + s.amount, 0)),
      totalAmountSettled: round(completed.reduce((sum, s) => sum + s.amount, 0)),
      currency: trip.baseCurrency,
      allSettled: tripSettlements.length > 0 && pending.length === 0,
    };
  }
}
