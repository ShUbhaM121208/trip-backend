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

const settlementParamSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  settlementId: z.string().min(1, 'Settlement ID is required'),
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

// POST /api/v1/trips/:tripId/settlements/generate - Generate settlements with tracking
router.post(
  '/trips/:tripId/settlements/generate',
  validateParams(tripIdParamSchema),
  controller.generateSettlements.bind(controller)
);

// GET /api/v1/trips/:tripId/settlements/tracked - Get settlements with status
router.get(
  '/trips/:tripId/settlements/tracked',
  validateParams(tripIdParamSchema),
  controller.getTrackedSettlements.bind(controller)
);

// PATCH /api/v1/trips/:tripId/settlements/:settlementId/mark-paid - Mark settlement as paid
router.patch(
  '/trips/:tripId/settlements/:settlementId/mark-paid',
  validateParams(settlementParamSchema),
  controller.markSettlementAsPaid.bind(controller)
);

// GET /api/v1/trips/:tripId/settlement-summary/status - Get settlement summary with status
router.get(
  '/trips/:tripId/settlement-summary/status',
  validateParams(tripIdParamSchema),
  controller.getSettlementSummaryWithStatus.bind(controller)
);

export default router;
