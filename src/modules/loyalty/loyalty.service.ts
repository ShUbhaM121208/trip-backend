/**
 * Loyalty Service
 * Business logic for loyalty program management
 */

import type { LoyaltyInfo } from '@/shared/types';
import { loyaltyData, trips, expenses, findUserById } from '@/shared/data/mockDataStore';
import { createNotFoundError } from '@/shared/middleware/errorHandler';

/**
 * Tier thresholds
 */
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 2500,
  gold: 5000,
};

/**
 * Service class handling loyalty program business logic
 */
export class LoyaltyService {
  /**
   * Get loyalty information for a user
   */
  getLoyaltyInfo(userId: string): LoyaltyInfo {
    const user = findUserById(userId);
    if (!user) {
      throw createNotFoundError('User', userId);
    }

    // Get existing loyalty data or calculate new
    let loyalty = loyaltyData.get(userId);
    if (!loyalty) {
      loyalty = this.calculateLoyaltyPoints(userId);
      loyaltyData.set(userId, loyalty);
    }

    return loyalty;
  }

  /**
   * Get tier information
   */
  getTierInfo(): {
    tiers: Array<{
      tier: 'bronze' | 'silver' | 'gold';
      minPoints: number;
      benefits: string[];
    }>;
  } {
    return {
      tiers: [
        {
          tier: 'bronze',
          minPoints: TIER_THRESHOLDS.bronze,
          benefits: [
            'Basic expense tracking',
            'Split expense calculations',
            'Budget monitoring',
          ],
        },
        {
          tier: 'silver',
          minPoints: TIER_THRESHOLDS.silver,
          benefits: [
            'All Bronze benefits',
            'AI expense insights',
            'Multi-currency support',
            'Priority support',
          ],
        },
        {
          tier: 'gold',
          minPoints: TIER_THRESHOLDS.gold,
          benefits: [
            'All Silver benefits',
            'Advanced analytics',
            'Custom categories',
            'Export capabilities',
            'Dedicated support',
          ],
        },
      ],
    };
  }

  /**
   * Calculate loyalty points for a user
   */
  private calculateLoyaltyPoints(userId: string): LoyaltyInfo {
    let score = 0;

    // Points for trips participated in (100 points per trip)
    const userTrips = trips.filter((trip) =>
      trip.participants.some((p) => p.id === userId)
    );
    score += userTrips.length * 100;

    // Points for expenses tracked (10 points per expense)
    const userExpenses = expenses.filter(
      (expense) => expense.paidBy.id === userId
    );
    score += userExpenses.length * 10;

    // Points for completed trips (bonus 50 points)
    const completedTrips = userTrips.filter((trip) => trip.status === 'completed');
    score += completedTrips.length * 50;

    // Determine tier
    const tier = this.determineTier(score);

    // Calculate next tier points
    const nextTierPoints = this.getNextTierPoints(tier);

    return {
      score,
      tier,
      nextTierPoints,
    };
  }

  /**
   * Determine tier based on score
   */
  private determineTier(score: number): 'bronze' | 'silver' | 'gold' {
    if (score >= TIER_THRESHOLDS.gold) return 'gold';
    if (score >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  /**
   * Get points needed for next tier
   */
  private getNextTierPoints(currentTier: 'bronze' | 'silver' | 'gold'): number {
    switch (currentTier) {
      case 'bronze':
        return TIER_THRESHOLDS.silver;
      case 'silver':
        return TIER_THRESHOLDS.gold;
      case 'gold':
        return TIER_THRESHOLDS.gold; // Already at max tier
    }
  }

  /**
   * Refresh loyalty points for a user
   */
  refreshLoyaltyPoints(userId: string): LoyaltyInfo {
    const user = findUserById(userId);
    if (!user) {
      throw createNotFoundError('User', userId);
    }

    const loyalty = this.calculateLoyaltyPoints(userId);
    loyaltyData.set(userId, loyalty);
    return loyalty;
  }
}
