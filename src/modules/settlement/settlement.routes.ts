/**
 * Settlement Routes
 * Defines HTTP routes for settlement and balance endpoints
 */

import { Router } from 'express';
import { SettlementController } from './settlement.controller';
import { validateParams } from '@/shared/middleware/validator';
import { z } from 'zod';

const router = Router();
const controller = new SettlementController();

/**
 * Validation schemas
 */
const tripIdParamSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
});

/**
 * Route definitions
 */

// GET /api/v1/trips/:tripId/balances - Get user balances
router.get(
  '/trips/:tripId/balances',
  validateParams(tripIdParamSchema),
  controller.getBalances.bind(controller)
);

// GET /api/v1/trips/:tripId/settlements - Get optimal settlements
router.get(
  '/trips/:tripId/settlements',
  validateParams(tripIdParamSchema),
  controller.getSettlements.bind(controller)
);

// GET /api/v1/trips/:tripId/settlement-summary - Get settlement summary
router.get(
  '/trips/:tripId/settlement-summary',
  validateParams(tripIdParamSchema),
  controller.getSettlementSummary.bind(controller)
);

export default router;
