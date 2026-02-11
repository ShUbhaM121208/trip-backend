/**
 * Loyalty Service
 * Business logic for loyalty program management
 */

import type { LoyaltyInfo } from '@/shared/types';
import { loyaltyData, trips, expenses, settlements, findUserById } from '@/shared/data/mockDataStore';
import { createNotFoundError } from '@/shared/middleware/errorHandler';
import { convertCurrency } from '@/shared/utils/currency.util';

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
   * 
   * SCORING SYSTEM:
   * - 100 points per trip participated
   * - 10 points per expense created
   * - 50 bonus points per completed trip
   * - 25 points per settlement paid
   * - 15 bonus points for prompt settlement (within 7 days)
   * - 100 bonus for 100% settlement completion rate
   * - 1 point per $10 spent (spend history)
   * - 100 bonus per high-value trip ($1000+)
   */
  private calculateLoyaltyPoints(userId: string): LoyaltyInfo {
    let score = 0;

    // 1. Points for trips participated in (100 points per trip)
    const userTrips = trips.filter((trip) =>
      trip.participants.some((p) => p.id === userId)
    );
    score += userTrips.length * 100;

    // 2. Points for expenses tracked (10 points per expense)
    const userExpenses = expenses.filter(
      (expense) => expense.paidBy.id === userId
    );
    score += userExpenses.length * 10;

    // 3. Points for completed trips (bonus 50 points)
    const completedTrips = userTrips.filter((trip) => trip.status === 'completed');
    score += completedTrips.length * 50;

    // 4. SETTLEMENT BEHAVIOR SCORING
    // Points for settlements paid (25 points each)
    const paidSettlements = settlements.filter(s => 
      s.from.id === userId && s.paid === true
    );
    score += paidSettlements.length * 25;

    // Bonus for prompt settlement (within 7 days) - 15 bonus points
    const promptSettlements = paidSettlements.filter(s => {
      if (!s.paidAt || !s.generatedAt) return false;
      const daysDiff = (new Date(s.paidAt).getTime() - new Date(s.generatedAt).getTime()) 
        / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    score += promptSettlements.length * 15;

    // Bonus for 100% settlement completion rate - 100 points
    const userGeneratedSettlements = settlements.filter(s => s.from.id === userId);
    if (userGeneratedSettlements.length > 0) {
      const completionRate = paidSettlements.length / userGeneratedSettlements.length;
      if (completionRate === 1.0) {
        score += 100;
      }
    }

    // 5. SPEND HISTORY ANALYSIS
    // Points for total spend (1 point per $10 spent in USD)
    const totalSpentUSD = userExpenses.reduce((sum, expense) => {
      const trip = trips.find(t => t.id === expense.tripId);
      if (!trip) return sum;
      const amountUSD = convertCurrency(expense.amount, expense.currency, 'USD');
      return sum + amountUSD;
    }, 0);
    score += Math.floor(totalSpentUSD / 10);

    // Bonus for high-value trips (trips where user spent > $1000 USD) - 100 bonus each
    const highValueTrips = userTrips.filter(trip => {
      const tripExpenses = userExpenses.filter(e => e.tripId === trip.id);
      const tripTotalUSD = tripExpenses.reduce((sum, e) => {
        const amountUSD = convertCurrency(e.amount, e.currency, 'USD');
        return sum + amountUSD;
      }, 0);
      return tripTotalUSD >= 1000;
    });
    score += highValueTrips.length * 100;

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

  /**
   * Get discounts available for a user based on their loyalty tier
   * 
   * DISCOUNT STRUCTURE:
   * Bronze: No discounts (free tier)
   * Silver: 10% subscription, 15% features, 20% exports
   * Gold: 25% subscription, 30% features, 50% exports
   */
  getDiscounts(userId: string): {
    tier: 'bronze' | 'silver' | 'gold';
    discounts: {
      subscriptionDiscount: number;
      featureDiscount: number;
      exportDiscount: number;
      prioritySupport: boolean;
    };
  } {
    const loyalty = this.getLoyaltyInfo(userId);
    
    // Discount structure by tier
    const discountMap = {
      bronze: {
        subscriptionDiscount: 0,
        featureDiscount: 0,
        exportDiscount: 0,
        prioritySupport: false,
      },
      silver: {
        subscriptionDiscount: 10,
        featureDiscount: 15,
        exportDiscount: 20,
        prioritySupport: true,
      },
      gold: {
        subscriptionDiscount: 25,
        featureDiscount: 30,
        exportDiscount: 50,
        prioritySupport: true,
      },
    };
    
    return {
      tier: loyalty.tier,
      discounts: discountMap[loyalty.tier],
    };
  }

  /**
   * Calculate discounted price based on user's loyalty tier
   * 
   * @param userId - User identifier
   * @param originalPrice - Original price before discount
   * @param discountType - Type of discount to apply
   * @returns Discounted price
   */
  applyDiscount(
    userId: string,
    originalPrice: number,
    discountType: 'subscription' | 'feature' | 'export'
  ): {
    originalPrice: number;
    discountPercent: number;
    discountAmount: number;
    finalPrice: number;
  } {
    const discountInfo = this.getDiscounts(userId);
    
    let discountPercent = 0;
    switch (discountType) {
      case 'subscription':
        discountPercent = discountInfo.discounts.subscriptionDiscount;
        break;
      case 'feature':
        discountPercent = discountInfo.discounts.featureDiscount;
        break;
      case 'export':
        discountPercent = discountInfo.discounts.exportDiscount;
        break;
    }
    
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;
    
    return {
      originalPrice,
      discountPercent,
      discountAmount,
      finalPrice,
    };
  }
}
