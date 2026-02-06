/**
 * Expense Routes
 * Defines HTTP routes for expense endpoints
 */

import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { validateBody, validateParams } from '@/shared/middleware/validator';
import { z } from 'zod';

const router = Router();
const controller = new ExpenseController();

/**
 * Validation schemas
 */
const tripIdParamSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
});

const expenseIdParamSchema = z.object({
  id: z.string().min(1, 'Expense ID is required'),
});

const expenseSplitSchema = z.object({
  userId: z.string(),
  amount: z.number().optional(),
  percentage: z.number().min(0).max(100).optional(),
});

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
  category: z.enum(['accommodation', 'transport', 'food', 'activities', 'shopping', 'other']),
  paidById: z.string().min(1, 'Payer ID is required'),
  splitType: z.enum(['equal', 'unequal', 'percentage']),
  splits: z.array(expenseSplitSchema),
  date: z.string(),
  notes: z.string().max(500).optional(),
});

const updateExpenseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  category: z.enum(['accommodation', 'transport', 'food', 'activities', 'shopping', 'other']).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Route definitions
 */

// GET /api/v1/trips/:tripId/expenses - Get all expenses for trip
router.get(
  '/trips/:tripId/expenses',
  validateParams(tripIdParamSchema),
  controller.getExpensesByTripId.bind(controller)
);

// POST /api/v1/trips/:tripId/expenses - Create new expense
router.post(
  '/trips/:tripId/expenses',
  validateParams(tripIdParamSchema),
  validateBody(createExpenseSchema),
  controller.createExpense.bind(controller)
);

// GET /api/v1/expenses/:id - Get expense by ID
router.get(
  '/expenses/:id',
  validateParams(expenseIdParamSchema),
  controller.getExpenseById.bind(controller)
);

// PUT /api/v1/expenses/:id - Update expense
router.put(
  '/expenses/:id',
  validateParams(expenseIdParamSchema),
  validateBody(updateExpenseSchema),
  controller.updateExpense.bind(controller)
);

// DELETE /api/v1/expenses/:id - Delete expense
router.delete(
  '/expenses/:id',
  validateParams(expenseIdParamSchema),
  controller.deleteExpense.bind(controller)
);

export default router;
