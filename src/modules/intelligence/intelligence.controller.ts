/**
 * Intelligence Controller
 * Handles HTTP requests for AI assistant endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { IntelligenceService } from './intelligence.service';
import { createLogger } from '@/shared/utils/logger.util';

const intelligenceService = new IntelligenceService();
const logger = createLogger('IntelligenceController');

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
      logger.info('Chat request received', {
        tripId: req.body.tripId,
        messageLength: req.body.content?.length || 0
      });

      const result = await intelligenceService.processMessage(req.body);
      
      logger.info('Chat request completed', {
        tripId: req.body.tripId,
        responseGenerated: true
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Chat request failed', {
        tripId: req.body.tripId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
      
      logger.debug('Get chat history request', { tripId });
      
      const history = intelligenceService.getChatHistory(tripId);
      
      logger.debug('Chat history retrieved', { 
        tripId, 
        messageCount: history.length 
      });

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      logger.error('Get chat history failed', { 
        tripId: req.query.tripId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
      
      logger.info('Clear chat history request', { tripId });
      
      intelligenceService.clearChatHistory(tripId);
      
      logger.info('Chat history cleared', { tripId });

      res.json({
        success: true,
        message: 'Chat history cleared successfully',
      });
    } catch (error) {
      logger.error('Clear chat history failed', {
        tripId: req.query.tripId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/intelligence/places/:destination
   * Get place insights for a destination
   */
  async getPlaceInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const destination = req.params.destination as string;
      
      logger.info('Get place insight request', { destination });
      
      const placeInsight = intelligenceService.getPlaceInsight(destination);
      
      logger.info('Place insight retrieved', { destination });

      res.json({
        success: true,
        data: { placeInsight },
      });
    } catch (error) {
      logger.error('Get place insight failed', {
        destination: req.params.destination,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/intelligence/destinations
   * Get list of available destinations
   */
  async getAvailableDestinations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const destinations = intelligenceService.getAvailableDestinations();
      res.json({
        success: true,
        data: { destinations },
      });
    } catch (error) {
      next(error);
    }
  }
}
