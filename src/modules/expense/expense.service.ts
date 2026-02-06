/**
 * Expense Service
 * Business logic for expense management and split calculations
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
    if (!trip.participants.some((p) => p.id === dto.paidById)) {
      throw createBadRequestError('Payer must be a trip participant');
    }

    // Calculate and validate splits
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
    if (dto.amount) {
      expense.amount = dto.amount;
      // Recalculate splits with new amount
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
   */
  deleteExpense(id: string): void {
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) {
      throw createNotFoundError('Expense', id);
    }
    expenses.splice(index, 1);
  }

  /**
   * Calculate splits based on split type
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
   * Calculate equal splits among participants
   */
  private calculateEqualSplits(totalAmount: number, participants: User[]): ExpenseSplit[] {
    const numParticipants = participants.length;
    const splitAmount = totalAmount / numParticipants;

    const splitAmounts = Array(numParticipants).fill(splitAmount);
    const adjustedAmounts = adjustSplitsForRounding(splitAmounts, totalAmount);

    return participants.map((participant, index) => ({
      userId: participant.id,
      amount: adjustedAmounts[index],
    }));
  }

  /**
   * Validate and adjust unequal splits
   */
  private validateUnequalSplits(
    totalAmount: number,
    providedSplits: ExpenseSplit[]
  ): ExpenseSplit[] {
    if (providedSplits.length === 0) {
      throw createValidationError('Unequal split requires split amounts for each participant');
    }

    const splitAmounts = providedSplits.map((s) => s.amount);
    const adjustedAmounts = adjustSplitsForRounding(splitAmounts, totalAmount);

    return providedSplits.map((split, index) => ({
      userId: split.userId,
      amount: adjustedAmounts[index],
    }));
  }

  /**
   * Calculate splits based on percentages
   */
  private calculatePercentageSplits(
    totalAmount: number,
    providedSplits: ExpenseSplit[]
  ): ExpenseSplit[] {
    if (providedSplits.length === 0) {
      throw createValidationError('Percentage split requires percentages for each participant');
    }

    // Validate percentages sum to 100
    const totalPercentage = providedSplits.reduce((sum, split) => {
      return sum + (split.percentage || 0);
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw createValidationError('Percentages must sum to 100');
    }

    // Calculate amounts from percentages
    const splitAmounts = providedSplits.map((split) => {
      return (totalAmount * (split.percentage || 0)) / 100;
    });

    const adjustedAmounts = adjustSplitsForRounding(splitAmounts, totalAmount);

    return providedSplits.map((split, index) => ({
      userId: split.userId,
      amount: adjustedAmounts[index],
      percentage: split.percentage,
    }));
  }
}
