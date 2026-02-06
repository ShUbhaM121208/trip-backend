/**
 * Budget Routes
 * Defines HTTP routes for budget endpoints
 */

import { Router } from 'express';
import { BudgetController } from './budget.controller';
import { validateBody, validateParams } from '@/shared/middleware/validator';
import { z } from 'zod';

const router = Router();
const controller = new BudgetController();

/**
 * Validation schemas
 */
const tripIdParamSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
});

const budgetCategorySchema = z.object({
  category: z.enum(['accommodation', 'transport', 'food', 'activities', 'shopping', 'other']),
  allocated: z.number().min(0, 'Allocated amount must be non-negative'),
  spent: z.number().optional(),
});

const updateBudgetSchema = z.object({
  categories: z.array(budgetCategorySchema).min(1, 'At least one category required'),
});

/**
 * Route definitions
 */

// GET /api/v1/trips/:tripId/budget - Get budget breakdown
router.get(
  '/trips/:tripId/budget',
  validateParams(tripIdParamSchema),
  controller.getBudgetBreakdown.bind(controller)
);

// PUT /api/v1/trips/:tripId/budget - Update budget allocations
router.put(
  '/trips/:tripId/budget',
  validateParams(tripIdParamSchema),
  validateBody(updateBudgetSchema),
  controller.updateBudgetAllocations.bind(controller)
);

export default router;
