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

  /**
   * POST /api/v1/trips/:tripId/settlements/generate
   * Generate and save settlements with tracking IDs
   */
  async generateSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settlements = settlementService.generateSettlements(getParam(req, 'tripId'));
      res.status(201).json({
        success: true,
        data: { settlements },
        message: 'Settlements generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/:tripId/settlements/tracked
   * Get settlements with tracking status
   */
  async getTrackedSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settlements = settlementService.getTrackedSettlements(getParam(req, 'tripId'));
      res.json({
        success: true,
        data: { settlements },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/trips/:tripId/settlements/:settlementId/mark-paid
   * Mark settlement as paid
   */
  async markSettlementAsPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settlement = settlementService.markSettlementAsPaid(
        getParam(req, 'tripId'),
        getParam(req, 'settlementId')
      );
      res.json({
        success: true,
        data: { settlement },
        message: 'Settlement marked as paid',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/:tripId/settlement-summary/status
   * Get settlement summary with payment status
   */
  async getSettlementSummaryWithStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = settlementService.getSettlementSummaryWithStatus(getParam(req, 'tripId'));
      res.json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }
}
