/**
 * Expense Controller
 * Handles HTTP requests for expense endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from './expense.service';
import { getParam } from '@/shared/utils/request.util';

const expenseService = new ExpenseService();

/**
 * Controller class for expense endpoints
 */
export class ExpenseController {
  /**
   * GET /api/v1/trips/:tripId/expenses
   * Get all expenses for a trip
   */
  async getExpensesByTripId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expenses = expenseService.getExpensesByTripId(getParam(req, 'tripId'));
      res.json({
        success: true,
        data: { expenses },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/:id
   * Get expense by ID
   */
  async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = expenseService.getExpenseById(getParam(req, 'id'));
      res.json({
        success: true,
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/trips/:tripId/expenses
   * Create new expense
   */
  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = expenseService.createExpense(getParam(req, 'tripId'), req.body);
      res.status(201).json({
        success: true,
        data: { expense },
        message: 'Expense created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/expenses/:id
   * Update existing expense
   */
  async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = expenseService.updateExpense(getParam(req, 'id'), req.body);
      res.json({
        success: true,
        data: { expense },
        message: 'Expense updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/expenses/:id
   * Delete expense
   */
  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      expenseService.deleteExpense(getParam(req, 'id'));
      res.json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
