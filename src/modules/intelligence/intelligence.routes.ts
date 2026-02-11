/**
 * Intelligence Routes
 * Defines HTTP routes for AI assistant endpoints
 */

import { Router } from 'express';
import { IntelligenceController } from './intelligence.controller';
import { validateBody } from '@/shared/middleware/validator';
import { z } from 'zod';

const router = Router();
const controller = new IntelligenceController();

/**
 * Validation schemas
 */
const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(1000),
  tripId: z.string().optional(),
});

/**
 * Route definitions
 */

// POST /api/v1/intelligence/chat - Send message to AI
router.post(
  '/intelligence/chat',
  validateBody(chatMessageSchema),
  controller.chat.bind(controller)
);

// GET /api/v1/intelligence/destinations - Get available destinations
router.get('/intelligence/destinations', controller.getAvailableDestinations.bind(controller));

// GET /api/v1/intelligence/places/:destination - Get place insights
router.get('/intelligence/places/:destination', controller.getPlaceInsight.bind(controller));

// GET /api/v1/intelligence/history - Get chat history
router.get('/intelligence/history', controller.getChatHistory.bind(controller));

// DELETE /api/v1/intelligence/history - Clear chat history
router.delete('/intelligence/history', controller.clearChatHistory.bind(controller));

export default router;
