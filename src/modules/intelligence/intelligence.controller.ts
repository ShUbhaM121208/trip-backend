/**
 * Intelligence Controller
 * Handles HTTP requests for AI assistant endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { IntelligenceService } from './intelligence.service';

const intelligenceService = new IntelligenceService();

/**
 * Controller class for intelligence endpoints
 */
export class IntelligenceController {
  /**
   * POST /api/v1/intelligence/chat
   * Send message to AI assistant
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await intelligenceService.processMessage(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/intelligence/history
   * Get chat history (optionally filtered by tripId)
   */
  async getChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tripId = req.query.tripId as string | undefined;
      const history = intelligenceService.getChatHistory(tripId);
      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/intelligence/history
   * Clear chat history
   */
  async clearChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tripId = req.query.tripId as string | undefined;
      intelligenceService.clearChatHistory(tripId);
      res.json({
        success: true,
        message: 'Chat history cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
