/**
 * Expense Model
 * Domain model for Expense entity
 */

import type { Expense, ExpenseSplit } from '@/shared/types';

export class ExpenseModel {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: any;
  splitType: 'equal' | 'unequal' | 'percentage';
  splits: ExpenseSplit[];
  date: string;
  notes?: string;

  constructor(expense: Expense) {
    this.id = expense.id;
    this.tripId = expense.tripId;
    this.title = expense.title;
    this.amount = expense.amount;
    this.currency = expense.currency;
    this.category = expense.category;
    this.paidBy = expense.paidBy;
    this.splitType = expense.splitType;
    this.splits = expense.splits;
    this.date = expense.date;
    this.notes = expense.notes;
  }

  /**
   * Convert model to plain object
   */
  toJSON(): Expense {
    return {
      id: this.id,
      tripId: this.tripId,
      title: this.title,
      amount: this.amount,
      currency: this.currency,
      category: this.category as any,
      paidBy: this.paidBy,
      splitType: this.splitType,
      splits: this.splits,
      date: this.date,
      notes: this.notes,
    };
  }

  /**
   * Validate that splits sum equals total amount
   */
  validateSplits(): boolean {
    const total = this.splits.reduce((sum, split) => sum + split.amount, 0);
    return Math.abs(total - this.amount) < 0.01; // Allow small rounding errors
  }

  /**
   * Get split for specific user
   */
  getSplitForUser(userId: string): ExpenseSplit | undefined {
    return this.splits.find((s) => s.userId === userId);
  }
}
