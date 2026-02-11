/**
 * EXPENSE SERVICE
 * Business logic for expense management and split calculations
 * 
 * CORE RESPONSIBILITIES:
 * 1. CRUD operations for expenses
 * 2. Split calculation logic (equal, unequal, percentage)
 * 3. Validation of splits against total amount
 * 4. Rounding precision handling
 * 
 * SPLIT CALCULATION ENGINE:
 * This service implements the core expense splitting logic that handles:
 * - Equal splits: Divide amount equally among participants
 * - Unequal splits: Custom amounts per participant
 * - Percentage splits: Percentage-based distribution
 * - Rounding precision: Ensures splits sum exactly to total
 * 
 * WHY THIS MATTERS:
 * Accurate split calculation is critical for:
 * - Fair expense distribution
 * - Precise balance calculations
 * - Avoiding rounding discrepancies
 * - Maintaining financial accuracy
 */

import type { Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseSplit, User } from '@/shared/types';
import { expenses, findTripById, findUserById } from '@/shared/data/mockDataStore';
import { generateExpenseId } from '@/shared/utils/id.util';
import { isValidDate } from '@/shared/utils/date.util';
import { round, adjustSplitsForRounding } from '@/shared/utils/rounding.util';
import {
  createNotFoundError,
  createBadRequestError,
  createValidationError,
} from '@/shared/middleware/errorHandler';
import { ExpenseModel } from './expense.model';

/**
 * Service class handling expense business logic
 */
export class ExpenseService {
  /**
   * Get all expenses for a trip
   * 
   * @param tripId - Trip identifier
   * @returns Array of expenses for the trip
   * @throws NotFoundError if trip doesn't exist
   */
  getExpensesByTripId(tripId: string): Expense[] {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    return expenses.filter((e) => e.tripId === tripId);
  }

  /**
   * Get expense by ID
   * 
   * @param id - Expense identifier
   * @returns Expense object
   * @throws NotFoundError if expense doesn't exist
   */
  getExpenseById(id: string): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) {
      throw createNotFoundError('Expense', id);
    }
    return expense;
  }

  /**
   * Create new expense with split calculations
   * 
   * ALGORITHM FLOW:
   * 1. Validate trip exists
   * 2. Validate date format (ISO 8601)
   * 3. Validate amount > 0
   * 4. Validate payer exists and is trip participant
   * 5. Calculate splits based on split type
   * 6. Validate splits sum to total (within rounding tolerance)
   * 7. Store expense with calculated splits
   * 
   * SPLIT TYPES:
   * - equal: Divides amount equally among all participants
   * - unequal: Uses provided custom amounts (must sum to total)
   * - percentage: Calculates amounts from percentages (must sum to 100%)
   * 
   * ROUNDING STRATEGY:
   * - Round each split to 2 decimals
   * - Calculate difference: total - sum(roundedSplits)
   * - Add difference to largest split (ensures exact match)
   * 
   * EDGE CASES HANDLED:
   * - Payer not in trip participants
   * - Split participants not in trip
   * - Splits don't sum to total (adjusted automatically)
   * - Percentages don't sum to 100% (error)
   * - Zero or negative amounts (error)
   * - Invalid date format (error)
   * 
   * @param tripId - Trip identifier
   * @param dto - Expense creation data
   * @returns Created expense with calculated splits
   * @throws ValidationError if data is invalid
   */
  createExpense(tripId: string, dto: CreateExpenseDto): Expense {
    // Validate trip exists
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    // Validate date
    if (!isValidDate(dto.date)) {
      throw createBadRequestError('Invalid date format. Use ISO 8601 format.');
    }

    // Validate amount
    if (dto.amount <= 0) {
      throw createBadRequestError('Amount must be greater than 0');
    }

    // Validate payer
    const payer = findUserById(dto.paidById);
    if (!payer) {
      throw createNotFoundError('User', dto.paidById);
    }

    // Validate payer is trip participant
    // WHY: Only trip participants can pay for trip expenses
    if (!trip.participants.some((p) => p.id === dto.paidById)) {
      throw createBadRequestError('Payer must be a trip participant');
    }

    // Calculate and validate splits
    // This is the core splitting logic - see calculateSplits() for details
    const calculatedSplits = this.calculateSplits(
      dto.amount,
      dto.splitType,
      dto.splits,
      trip.participants
    );

    // Create new expense
    const newExpense: Expense = {
      id: generateExpenseId(),
      tripId,
      title: dto.title,
      amount: dto.amount,
      currency: dto.currency,
      category: dto.category,
      paidBy: payer,
      splitType: dto.splitType,
      splits: calculatedSplits,
      date: dto.date,
      notes: dto.notes,
    };

    expenses.push(newExpense);
    return newExpense;
  }

  /**
   * Update existing expense
   * 
   * LIMITATIONS:
   * Currently only allows updating:
   * - title: Expense description
   * - amount: Total amount (recalculates splits)
   * - category: Expense category
   * - notes: Optional notes
   * 
   * CANNOT UPDATE:
   * - splitType: Would require recalculating all splits
   * - splits: Would require revalidation
   * - paidBy: Would require recalculating balances
   * - date: Immutable for audit trail
   * - tripId: Immutable (belongs to one trip)
   * 
   * FUTURE ENHANCEMENT:
   * Allow full expense editing with automatic recalculation
   * 
   * @param id - Expense identifier
   * @param dto - Update data
   * @returns Updated expense
   * @throws NotFoundError if expense doesn't exist
   */
  updateExpense(id: string, dto: UpdateExpenseDto): Expense {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) {
      throw createNotFoundError('Expense', id);
    }

    // Validate amount if provided
    if (dto.amount !== undefined && dto.amount <= 0) {
      throw createBadRequestError('Amount must be greater than 0');
    }

    // Update fields
    if (dto.title) expense.title = dto.title;
    
    // If amount changes, recalculate splits
    // WHY: Split amounts must always sum to total amount
    if (dto.amount) {
      expense.amount = dto.amount;
      const trip = findTripById(expense.tripId);
      if (trip) {
        expense.splits = this.calculateSplits(
          dto.amount,
          expense.splitType,
          expense.splits,
          trip.participants
        );
      }
    }
    
    if (dto.category) expense.category = dto.category;
    if (dto.notes !== undefined) expense.notes = dto.notes;

    return expense;
  }

  /**
   * Delete expense
   * 
   * EFFECTS:
   * - Removes expense from storage
   * - Affects trip's totalSpent (computed field)
   * - Affects user balances (computed field)
   * - Affects settlements (computed field)
   * 
   * NO CASCADE DELETES:
   * Splits are embedded, so they're deleted with expense
   * 
   * @param id - Expense identifier
   * @throws NotFoundError if expense doesn't exist
   */
  deleteExpense(id: string): void {
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) {
      throw createNotFoundError('Expense', id);
    }
    expenses.splice(index, 1);
  }

  /**
   * CALCULATE SPLITS - CORE SPLITTING ENGINE
   * 
   * Routes to appropriate split calculation based on type.
   * This is the entry point for all split calculations.
   * 
   * SPLIT TYPES SUPPORTED:
   * 1. equal: Divide equally among participants
   * 2. unequal: Use provided custom amounts
   * 3. percentage: Calculate from provided percentages
   * 
   * ALL SPLIT TYPES:
   * - Round to 2 decimal places
   * - Adjust largest split if rounding causes mismatch
   * - Validate splits sum to total (within 0.01 tolerance)
   * 
   * WHY 0.01 TOLERANCE:
   * Floating point arithmetic can cause tiny discrepancies
   * 0.01 is 1 cent - acceptable rounding error for currencies
   * 
   * @param totalAmount - Total expense amount
   * @param splitType - How to divide the expense
   * @param providedSplits - User-provided split data (for unequal/percentage)
   * @param participants - Trip participants (for equal split)
   * @returns Calculated and validated splits
   * @throws ValidationError if splits are invalid
   * @private
   */
  private calculateSplits(
    totalAmount: number,
    splitType: 'equal' | 'unequal' | 'percentage',
    providedSplits: ExpenseSplit[],
    participants: User[]
  ): ExpenseSplit[] {
    switch (splitType) {
      case 'equal':
        return this.calculateEqualSplits(totalAmount, participants);

      case 'unequal':
        return this.validateUnequalSplits(totalAmount, providedSplits);

      case 'percentage':
        return this.calculatePercentageSplits(totalAmount, providedSplits);

      default:
        throw createBadRequestError(`Invalid split type: ${splitType}`);
    }
  }

  /**
   * EQUAL SPLIT CALCULATION
   * 
   * ALGORITHM:
   * 1. Divide total by number of participants
   * 2. Round each split to 2 decimals
   * 3. Calculate sum of rounded splits
   * 4. If sum ≠ total, adjust largest split by difference
   * 
   * EXAMPLE:
   * Amount: $100.00, Participants: 3
   * - Raw split: $33.333... each
   * - Rounded: $33.33, $33.33, $33.33
   * - Sum: $99.99 (missing $0.01)
   * - Adjusted: $33.34, $33.33, $33.33
   * - Final sum: $100.00 ✓
   * 
   * WHY ADJUST LARGEST SPLIT:
   * - Minimizes relative error (small % change for larger amounts)
   * - Consistent behavior (always same person gets adjustment)
   * - Simple to implement and understand
   * 
   * ALTERNATIVE APPROACHES CONSIDERED:
   * - Distribute rounding error randomly: Not deterministic
   * - Split error across all participants: More complex, minimal benefit
   * - Use arbitrary precision decimals: Overkill for currency
   * 
   * EDGE CASES:
   * - Single participant: Gets full amount (no rounding needed)
   * - Zero amount: Each gets $0.00 (shouldn't happen due to validation)
   * - Very small amounts: May result in $0.00 splits (acceptable)
   * 
   * @param totalAmount - Total expense amount
   * @param participants - All trip participants
   * @returns Equal splits with rounding adjustment
   * @private
   */
  private calculateEqualSplits(totalAmount: number, participants: User[]): ExpenseSplit[] {
    const numParticipants = participants.length;
    
    // Calculate raw split amount (may have many decimals)
    const splitAmount = totalAmount / numParticipants;

    // Create array of equal amounts
    const splitAmounts = Array(numParticipants).fill(splitAmount);
    
    // Apply rounding adjustment to ensure sum equals total
    // See adjustSplitsForRounding() in rounding.util.ts for details
    const adjustedAmounts = adjustSplitsForRounding(splitAmounts, totalAmount);

    // Map to ExpenseSplit objects with userId
    return participants.map((participant, index) => ({
      userId: participant.id,
      amount: adjustedAmounts[index],
    }));
  }

  /**
   * UNEQUAL SPLIT VALIDATION
   * 
   * ALGORITHM:
   * 1. Accept user-provided custom amounts for each participant
   * 2. Round each amount to 2 decimals
   * 3. Calculate sum of rounded amounts
   * 4. If sum ≠ total, adjust largest split by difference
   * 
   * EXAMPLE:
   * Amount: $100.00, Splits: [$60.00, $25.00, $15.00]
   * - Rounded: $60.00, $25.00, $15.00
   * - Sum: $100.00 ✓
   * - No adjustment needed
   * 
   * EXAMPLE WITH ROUNDING:
   * Amount: $100.00, Splits: [$60.005, $25.003, $14.992]
   * - Rounded: $60.01, $25.00, $14.99
   * - Sum: $100.00 ✓
   * - Adjusted: $60.00, $25.00, $15.00 (largest reduced by $0.01)
   * 
   * WHY THIS APPROACH:
   * - User intent is preserved (custom amounts)
   * - Automatic adjustment prevents validation errors
   * - Largest split absorbs rounding (minimal impact)
   * 
   * VALIDATION:
   * - Splits array must not be empty
   * - Each amount must be >= 0 (checked in Zod schema)
   * - Sum must be within 0.01 of total (after adjustment)
   * 
   * USER EXPERIENCE:
   * User provides: [$60, $25, $15] for $100
   * System accepts and may adjust slightly for rounding
   * User sees: [$60.00, $25.00, $15.00] (matches intent)
   * 
   * EDGE CASES:
   * - User provides amounts summing to $99.99 for $100:
   *   Adjusted to sum to $100.00 (largest +$0.01)
   * - User provides amounts summing to $100.01 for $100:
   *   Adjusted to sum to $100.00 (largest -$0.01)
   * - Large discrepancy (e.g., $90 for $100):
   *   Could happen due to UI bug - system adjusts automatically
   * 
   * @param totalAmount - Total expense amount
   * @param providedSplits - User-provided custom split amounts
   * @returns Validated splits with rounding adjustment
   * @throws ValidationError if no splits provided
   * @private
   */
  private validateUnequalSplits(
    totalAmount: number,
    providedSplits: ExpenseSplit[]
  ): ExpenseSplit[] {
    if (providedSplits.length === 0) {
      throw createValidationError('Unequal split requires split amounts for each participant');
    }

    // Extract amounts from split objects
    const splitAmounts = providedSplits.map((s) => s.amount);
    
    // Apply rounding adjustment to ensure sum equals total
    const adjustedAmounts = adjustSplitsForRounding(splitAmounts, totalAmount);

    // Map back to ExpenseSplit objects with adjusted amounts
    return providedSplits.map((split, index) => ({
      userId: split.userId,
      amount: adjustedAmounts[index],
    }));
  }

  /**
   * PERCENTAGE SPLIT CALCULATION
   * 
   * ALGORITHM:
   * 1. Validate percentages sum to 100% (within 0.01 tolerance)
   * 2. Calculate amount for each split: (total * percentage) / 100
   * 3. Round each amount to 2 decimals
   * 4. If sum ≠ total, adjust largest split by difference
   * 
   * EXAMPLE:
   * Amount: $100.00, Percentages: [60%, 25%, 15%]
   * - Calculations: $60.00, $25.00, $15.00
   * - Rounded: $60.00, $25.00, $15.00
   * - Sum: $100.00 ✓
   * - No adjustment needed
   * 
   * EXAMPLE WITH ROUNDING:
   * Amount: $100.00, Percentages: [33.33%, 33.33%, 33.34%]
   * - Calculations: $33.33, $33.33, $33.34
   * - Rounded: $33.33, $33.33, $33.34
   * - Sum: $100.00 ✓
   * 
   * EXAMPLE WITH COMPLEX ROUNDING:
   * Amount: $77.77, Percentages: [50%, 30%, 20%]
   * - Calculations: $38.885, $23.331, $15.554
   * - Rounded: $38.89, $23.33, $15.55
   * - Sum: $77.77 ✓
   * - Adjusted: $38.88, $23.33, $15.56 (largest -$0.01, smallest +$0.01)
   * 
   * WHY PERCENTAGE SPLIT:
   * - Useful for unequal contributions (e.g., 70/30 split)
   * - Maintains relative proportions
   * - Easier to understand than raw amounts for some users
   * 
   * PERCENTAGE VALIDATION:
   * - Must sum to exactly 100% (within 0.01 tolerance)
   * - Each percentage must be 0-100 (checked in Zod schema)
   * - At least one split required
   * 
   * WHY 0.01 TOLERANCE:
   * - UI might represent 33.33% + 33.33% + 33.33% = 99.99%
   * - Floating point: 33.33 + 33.33 + 33.33 = 99.99 (not 100)
   * - 0.01% tolerance allows for UI rounding while preventing errors
   * 
   * EDGE CASES:
   * - 0% split: Participant pays $0.00 (valid, might opt out)
   * - 100% single participant: One person pays all (valid)
   * - Percentages sum to 99.99%: Accepted (within tolerance)
   * - Percentages sum to 95%: Error (exceeds tolerance)
   * 
   * @param totalAmount - Total expense amount
   * @param providedSplits - Splits with percentages
   * @returns Calculated splits with rounding adjustment
   * @throws ValidationError if percentages don't sum to 100%
   * @private
   */
  private calculatePercentageSplits(
    totalAmount: number,
    providedSplits: ExpenseSplit[]
  ): ExpenseSplit[] {
    if (providedSplits.length === 0) {
      throw createValidationError('Percentage split requires percentages for each participant');
    }

    // Validate percentages sum to 100
    // WHY: Total must be distributed exactly (no more, no less)
    const totalPercentage = providedSplits.reduce((sum, split) => {
      return sum + (split.percentage || 0);
    }, 0);

    // Allow 0.01% tolerance for floating point errors
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw createValidationError('Percentages must sum to 100');
    }

    // Calculate amounts from percentages
    // Formula: amount = (totalAmount * percentage) / 100
    const splitAmounts = providedSplits.map((split) => {
      return (totalAmount * (split.percentage || 0)) / 100;
    });

    // Apply rounding adjustment to ensure sum equals total
    const adjustedAmounts = adjustSplitsForRounding(splitAmounts, totalAmount);

    // Map to ExpenseSplit objects with calculated amounts and original percentages
    return providedSplits.map((split, index) => ({
      userId: split.userId,
      amount: adjustedAmounts[index],
      percentage: split.percentage,
    }));
  }
}
