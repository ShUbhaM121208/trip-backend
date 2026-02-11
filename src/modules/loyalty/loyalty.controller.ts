/**
 * Loyalty Controller
 * Handles HTTP requests for loyalty endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { LoyaltyService } from './loyalty.service';
import { getParam } from '@/shared/utils/request.util';

const loyaltyService = new LoyaltyService();

/**
 * Controller class for loyalty endpoints
 */
export class LoyaltyController {
  /**
   * GET /api/v1/loyalty/:userId
   * Get loyalty information for a user
   */
  async getLoyaltyInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loyalty = loyaltyService.getLoyaltyInfo(getParam(req, 'userId'));
      res.json({
        success: true,
        data: { loyalty },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/loyalty/tiers
   * Get tier information
   */
  async getTierInfo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tierInfo = loyaltyService.getTierInfo();
      res.json({
        success: true,
        data: tierInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/loyalty/:userId/refresh
   * Refresh loyalty points for a user
   */
  async refreshLoyaltyPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loyalty = loyaltyService.refreshLoyaltyPoints(getParam(req, 'userId'));
      res.json({
        success: true,
        data: { loyalty },
        message: 'Loyalty points refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/loyalty/:userId/discounts
   * Get available discounts for a user
   */
  async getDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discounts = loyaltyService.getDiscounts(getParam(req, 'userId'));
      res.json({
        success: true,
        data: discounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/loyalty/:userId/apply-discount
   * Calculate discounted price
   */
  async applyDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { originalPrice, discountType } = req.body;
      const result = loyaltyService.applyDiscount(
        getParam(req, 'userId'),
        originalPrice,
        discountType
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
