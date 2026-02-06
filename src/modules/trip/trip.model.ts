/**
 * Trip Model
 * Domain model for Trip entity
 */

import type { Trip, User } from '@/shared/types';

export class TripModel {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  budget: number;
  totalSpent: number;
  participants: User[];
  status: 'planning' | 'active' | 'completed';

  constructor(trip: Trip) {
    this.id = trip.id;
    this.name = trip.name;
    this.description = trip.description;
    this.startDate = trip.startDate;
    this.endDate = trip.endDate;
    this.baseCurrency = trip.baseCurrency;
    this.budget = trip.budget;
    this.totalSpent = trip.totalSpent;
    this.participants = trip.participants;
    this.status = trip.status;
  }

  /**
   * Convert model to plain object
   */
  toJSON(): Trip {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate,
      baseCurrency: this.baseCurrency,
      budget: this.budget,
      totalSpent: this.totalSpent,
      participants: this.participants,
      status: this.status,
    };
  }

  /**
   * Check if trip is active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if trip is within budget
   */
  isWithinBudget(): boolean {
    return this.totalSpent <= this.budget;
  }

  /**
   * Get budget usage percentage
   */
  getBudgetUsagePercentage(): number {
    return (this.totalSpent / this.budget) * 100;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return this.budget - this.totalSpent;
  }
}
