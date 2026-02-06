/**
 * Budget Controller
 * Handles HTTP requests for budget endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { BudgetService } from './budget.service';
import { getParam } from '@/shared/utils/request.util';

const budgetService = new BudgetService();

/**
 * Controller class for budget endpoints
 */
export class BudgetController {
  /**
   * GET /api/v1/trips/:tripId/budget
   * Get budget breakdown for a trip
   */
  async getBudgetBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const budget = budgetService.getBudgetBreakdown(getParam(req, 'tripId'));
      res.json({
        success: true,
        data: budget,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/trips/:tripId/budget
   * Update budget allocations
   */
  async updateBudgetAllocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = budgetService.updateBudgetAllocations(getParam(req, 'tripId'), req.body);
      res.json({
        success: true,
        data: { categories },
        message: 'Budget allocations updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
