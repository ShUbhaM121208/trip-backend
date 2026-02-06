/**
 * Settlement Service
 * Business logic for balance calculations and settlement optimization
 */

import type { Balance, Settlement, User } from '@/shared/types';
import { expenses, findTripById } from '@/shared/data/mockDataStore';
import { round } from '@/shared/utils/rounding.util';
import { convertCurrency } from '@/shared/utils/currency.util';
import { createNotFoundError } from '@/shared/middleware/errorHandler';

/**
 * Service class handling settlement and balance calculations
 */
export class SettlementService {
  /**
   * Calculate balances for all trip participants
   * Balance = Total Paid - Total Owed
   */
  calculateBalances(tripId: string): Balance[] {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    const tripExpenses = expenses.filter((e) => e.tripId === tripId);
    const balanceMap = new Map<string, { user: User; paid: number; owed: number }>();

    // Initialize balance for each participant
    trip.participants.forEach((participant) => {
      balanceMap.set(participant.id, {
        user: participant,
        paid: 0,
        owed: 0,
      });
    });

    // Calculate paid and owed amounts
    tripExpenses.forEach((expense) => {
      // Convert expense to trip's base currency
      const amountInBaseCurrency = convertCurrency(
        expense.amount,
        expense.currency,
        trip.baseCurrency
      );

      // Add to payer's paid amount
      const payerBalance = balanceMap.get(expense.paidBy.id);
      if (payerBalance) {
        payerBalance.paid += amountInBaseCurrency;
      }

      // Add to each participant's owed amount
      expense.splits.forEach((split) => {
        const participantBalance = balanceMap.get(split.userId);
        if (participantBalance) {
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
    const balances: Balance[] = [];
    balanceMap.forEach((data) => {
      const netBalance = round(data.paid - data.owed);
      balances.push({
        userId: data.user.id,
        userName: data.user.name,
        amount: netBalance,
      });
    });

    // Sort by amount (highest positive first, then lowest negative)
    return balances.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate optimal settlements using greedy algorithm
   * Minimizes number of transactions required
   */
  calculateSettlements(tripId: string): Settlement[] {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    const balances = this.calculateBalances(tripId);
    const settlements: Settlement[] = [];

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = balances
      .filter((b) => b.amount > 0.01)
      .map((b) => ({
        user: trip.participants.find((p) => p.id === b.userId)!,
        amount: b.amount,
      }));

    const debtors = balances
      .filter((b) => b.amount < -0.01)
      .map((b) => ({
        user: trip.participants.find((p) => p.id === b.userId)!,
        amount: Math.abs(b.amount),
      }));

    // Greedy algorithm: match largest debtor with largest creditor
    let creditorIdx = 0;
    let debtorIdx = 0;

    while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
      const creditor = creditors[creditorIdx];
      const debtor = debtors[debtorIdx];

      // Calculate settlement amount (minimum of what's owed and what's due)
      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      if (settlementAmount > 0.01) {
        // Only create settlement if amount is significant
        settlements.push({
          from: debtor.user,
          to: creditor.user,
          amount: round(settlementAmount),
          currency: trip.baseCurrency,
        });
      }

      // Update remaining amounts
      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      // Move to next creditor/debtor if current one is settled
      if (creditor.amount < 0.01) creditorIdx++;
      if (debtor.amount < 0.01) debtorIdx++;
    }

    return settlements;
  }

  /**
   * Get summary statistics for a trip's settlements
   */
  getSettlementSummary(tripId: string): {
    totalTransactions: number;
    totalAmountToSettle: number;
    currency: string;
  } {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    const settlements = this.calculateSettlements(tripId);
    const totalAmountToSettle = settlements.reduce((sum, s) => sum + s.amount, 0);

    return {
      totalTransactions: settlements.length,
      totalAmountToSettle: round(totalAmountToSettle),
      currency: trip.baseCurrency,
    };
  }
}
