/**
 * Central Route Registry
 * Aggregates all module routes
 */

import { Router } from 'express';
import tripRoutes from './modules/trip/trip.routes';
import expenseRoutes from './modules/expense/expense.routes';
import settlementRoutes from './modules/settlement/settlement.routes';
import budgetRoutes from './modules/budget/budget.routes';
import loyaltyRoutes from './modules/loyalty/loyalty.routes';
import intelligenceRoutes from './modules/intelligence/intelligence.routes';
import supportRoutes from './modules/support/support.routes';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Register all module routes
 * Each module is responsible for its own route definitions
 */
router.use(tripRoutes);           // Trip management routes
router.use(expenseRoutes);        // Expense tracking routes
router.use(settlementRoutes);     // Balance and settlement routes
router.use(budgetRoutes);         // Budget management routes
router.use(loyaltyRoutes);        // Loyalty program routes
router.use(intelligenceRoutes);   // AI assistant routes
router.use(supportRoutes);        // Support ticket routes

export default router;
