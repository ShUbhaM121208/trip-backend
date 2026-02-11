/**
 * Budget Service
 * Business logic for budget tracking and category aggregation
 */

import type { BudgetCategory, ExpenseCategory, UpdateBudgetDto } from '@/shared/types';
import { expenses, budgetCategories, findTripById } from '@/shared/data/mockDataStore';
import { round } from '@/shared/utils/rounding.util';
import { convertCurrency } from '@/shared/utils/currency.util';
import { createNotFoundError, createBadRequestError } from '@/shared/middleware/errorHandler';

/**
 * Service class handling budget business logic
 */
export class BudgetService {
  /**
   * Get budget breakdown for a trip
   */
  getBudgetBreakdown(tripId: string): {
    overall: { budget: number; spent: number; remaining: number; percentage: number };
    categories: BudgetCategory[];
  } {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    // Get or initialize budget categories for trip
    let categories = budgetCategories.get(tripId);
    if (!categories) {
      // Initialize default budget categories
      categories = this.initializeDefaultBudget(tripId, trip.budget);
    }

    // Calculate spent amount for each category
    const categoriesWithSpent = categories.map((category) => ({
      ...category,
      spent: this.calculateCategorySpent(tripId, category.category, trip.baseCurrency),
    }));

    // Calculate overall totals
    const totalAllocated = categoriesWithSpent.reduce((sum, cat) => sum + cat.allocated, 0);
    const totalSpent = categoriesWithSpent.reduce((sum, cat) => sum + cat.spent, 0);
    const remaining = totalAllocated - totalSpent;
    const percentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return {
      overall: {
        budget: round(totalAllocated),
        spent: round(totalSpent),
        remaining: round(remaining),
        percentage: round(percentage, 1),
      },
      categories: categoriesWithSpent.map((cat) => ({
        category: cat.category,
        allocated: round(cat.allocated),
        spent: round(cat.spent),
      })),
    };
  }

  /**
   * Update budget allocations for categories
   */
  updateBudgetAllocations(tripId: string, dto: UpdateBudgetDto): BudgetCategory[] {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    // Validate that all categories are valid
    const validCategories: ExpenseCategory[] = [
      'accommodation',
      'transport',
      'food',
      'activities',
      'shopping',
      'other',
    ];

    for (const category of dto.categories) {
      if (!validCategories.includes(category.category)) {
        throw createBadRequestError(`Invalid category: ${category.category}`);
      }

      if (category.allocated < 0) {
        throw createBadRequestError(`Allocated amount must be non-negative for ${category.category}`);
      }
    }

    // Calculate spent amounts for validation
    const categoriesWithSpent = dto.categories.map((category) => ({
      ...category,
      spent: this.calculateCategorySpent(tripId, category.category, trip.baseCurrency),
    }));

    // Update budget categories
    budgetCategories.set(tripId, categoriesWithSpent);

    return categoriesWithSpent.map((cat) => ({
      category: cat.category,
      allocated: round(cat.allocated),
      spent: round(cat.spent),
    }));
  }

  /**
   * Calculate spent amount for a specific category
   */
  private calculateCategorySpent(
    tripId: string,
    category: ExpenseCategory,
    baseCurrency: string
  ): number {
    const tripExpenses = expenses.filter(
      (e) => e.tripId === tripId && e.category === category
    );

    return tripExpenses.reduce((sum, expense) => {
      const amountInBaseCurrency = convertCurrency(
        expense.amount,
        expense.currency,
        baseCurrency
      );
      return sum + amountInBaseCurrency;
    }, 0);
  }

  /**
   * Initialize default budget allocations
   */
  private initializeDefaultBudget(tripId: string, totalBudget: number): BudgetCategory[] {
    // Default allocation percentages
    const defaultAllocations: Record<ExpenseCategory, number> = {
      accommodation: 0.30, // 30%
      transport: 0.20,     // 20%
      food: 0.20,          // 20%
      activities: 0.15,    // 15%
      shopping: 0.10,      // 10%
      other: 0.05,         // 5%
    };

    const categories: BudgetCategory[] = Object.entries(defaultAllocations).map(
      ([category, percentage]) => ({
        category: category as ExpenseCategory,
        allocated: totalBudget * percentage,
        spent: 0,
      })
    );

    budgetCategories.set(tripId, categories);
    return categories;
  }

  /**
   * Get budget status for a category
   */
  getCategoryStatus(
    allocated: number,
    spent: number
  ): 'under' | 'near' | 'over' {
    const percentage = (spent / allocated) * 100;
    if (percentage > 100) return 'over';
    if (percentage > 90) return 'near';
    return 'under';
  }

  /**
   * Get duration-based budget metrics
   */
  getDurationMetrics(tripId: string): {
    totalDays: number;
    elapsedDays: number | null;
    remainingDays: number | null;
    budgetPerDay: number;
    avgDailySpend: number | null;
    recommendedDailySpend: number | null;
    projectedTotal: number | null;
    projectedOverage: number | null;
  } {
    const trip = findTripById(tripId);
    if (!trip) {
      throw createNotFoundError('Trip', tripId);
    }

    // Calculate total trip duration
    const startTime = new Date(trip.startDate).getTime();
    const endTime = new Date(trip.endDate).getTime();
    const totalDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
    
    // Budget per day (simple division)
    const budgetPerDay = trip.budget / totalDays;
    
    // If trip is active, calculate more metrics
    const now = new Date().getTime();
    const isActive = now >= startTime && now <= endTime;
    const hasStarted = now >= startTime;
    
    let elapsedDays = null;
    let remainingDays = null;
    let avgDailySpend = null;
    let recommendedDailySpend = null;
    let projectedTotal = null;
    let projectedOverage = null;
    
    if (hasStarted) {
      elapsedDays = Math.max(1, Math.ceil((now - startTime) / (1000 * 60 * 60 * 24)));
      remainingDays = Math.max(0, Math.ceil((endTime - now) / (1000 * 60 * 60 * 24)));
      
      // Calculate average daily spend so far
      if (elapsedDays > 0) {
        avgDailySpend = trip.totalSpent / elapsedDays;
        
        // Project total spending based on current rate
        projectedTotal = avgDailySpend * totalDays;
        projectedOverage = projectedTotal - trip.budget;
      }
      
      // Calculate recommended daily spend for remaining days
      if (remainingDays > 0) {
        const remainingBudget = trip.budget - trip.totalSpent;
        recommendedDailySpend = remainingBudget / remainingDays;
      }
    }
    
    return {
      totalDays,
      elapsedDays,
      remainingDays,
      budgetPerDay: round(budgetPerDay),
      avgDailySpend: avgDailySpend !== null ? round(avgDailySpend) : null,
      recommendedDailySpend: recommendedDailySpend !== null ? round(recommendedDailySpend) : null,
      projectedTotal: projectedTotal !== null ? round(projectedTotal) : null,
      projectedOverage: projectedOverage !== null ? round(projectedOverage) : null,
    };
  }

  /**
   * Get enhanced budget breakdown with duration metrics
   */
  getBudgetBreakdownWithDuration(tripId: string) {
    const breakdown = this.getBudgetBreakdown(tripId);
    const duration = this.getDurationMetrics(tripId);
    
    return {
      ...breakdown,
      duration,
    };
  }
}
