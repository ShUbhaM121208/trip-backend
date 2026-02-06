/**
 * Support Controller
 * Handles HTTP requests for support ticket endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { SupportService } from './support.service';
import { getParam } from '@/shared/utils/request.util';

const supportService = new SupportService();

/**
 * Controller class for support endpoints
 */
export class SupportController {
  /**
   * GET /api/v1/support/tickets
   * Get all support tickets (optionally filtered by status)
   */
  async getAllTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as 'open' | 'in-progress' | 'resolved' | undefined;
      const tickets = supportService.getAllTickets(status);
      res.json({
        success: true,
        data: { tickets },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/support/tickets/:id
   * Get ticket by ID
   */
  async getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = supportService.getTicketById(getParam(req, 'id'));
      res.json({
        success: true,
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/support/tickets
   * Create new support ticket
   */
  async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = supportService.createTicket(req.body);
      res.status(201).json({
        success: true,
        data: { ticket },
        message: 'Support ticket created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/support/tickets/:id
   * Update ticket status
   */
  async updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = supportService.updateTicket(getParam(req, 'id'), req.body);
      res.json({
        success: true,
        data: { ticket },
        message: 'Ticket updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/support/tickets/:id
   * Delete ticket
   */
  async deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      supportService.deleteTicket(getParam(req, 'id'));
      res.json({
        success: true,
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/support/stats
   * Get ticket statistics
   */
  async getTicketStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = supportService.getTicketStats();
      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}
