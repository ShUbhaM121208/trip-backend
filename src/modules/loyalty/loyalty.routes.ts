/**
 * Loyalty Routes
 * Defines HTTP routes for loyalty endpoints
 */

import { Router } from 'express';
import { LoyaltyController } from './loyalty.controller';
import { validateParams, validateBody } from '@/shared/middleware/validator';
import { z } from 'zod';

const router = Router();
const controller = new LoyaltyController();

/**
 * Validation schemas
 */
const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const applyDiscountSchema = z.object({
  originalPrice: z.number().positive('Original price must be positive'),
  discountType: z.enum(['subscription', 'feature', 'export']),
});

/**
 * Route definitions
 */

// GET /api/v1/loyalty/tiers - Get tier information
router.get('/loyalty/tiers', controller.getTierInfo.bind(controller));

// GET /api/v1/loyalty/:userId - Get loyalty info for user
router.get(
  '/loyalty/:userId',
  validateParams(userIdParamSchema),
  controller.getLoyaltyInfo.bind(controller)
);

// POST /api/v1/loyalty/:userId/refresh - Refresh loyalty points
router.post(
  '/loyalty/:userId/refresh',
  validateParams(userIdParamSchema),
  controller.refreshLoyaltyPoints.bind(controller)
);

// GET /api/v1/loyalty/:userId/discounts - Get available discounts
router.get(
  '/loyalty/:userId/discounts',
  validateParams(userIdParamSchema),
  controller.getDiscounts.bind(controller)
);

// POST /api/v1/loyalty/:userId/apply-discount - Calculate discounted price
router.post(
  '/loyalty/:userId/apply-discount',
  validateParams(userIdParamSchema),
  validateBody(applyDiscountSchema),
  controller.applyDiscount.bind(controller)
);

export default router;
