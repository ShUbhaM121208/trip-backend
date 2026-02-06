/**
 * Settlement Controller
 * Handles HTTP requests for settlement and balance endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { SettlementService } from './settlement.service';
import { getParam } from '@/shared/utils/request.util';

const settlementService = new SettlementService();

/**
 * Controller class for settlement endpoints
 */
export class SettlementController {
  /**
   * GET /api/v1/trips/:tripId/balances
   * Get user balances for a trip
   */
  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const balances = settlementService.calculateBalances(getParam(req, 'tripId'));
      res.json({
        success: true,
        data: { balances },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/:tripId/settlements
   * Get optimal settlements for a trip
   */
  async getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settlements = settlementService.calculateSettlements(getParam(req, 'tripId'));
      res.json({
        success: true,
        data: { settlements },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/:tripId/settlement-summary
   * Get settlement summary statistics
   */
  async getSettlementSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = settlementService.getSettlementSummary(getParam(req, 'tripId'));
      res.json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }
}
