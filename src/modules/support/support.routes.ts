/**
 * Support Routes
 * Defines HTTP routes for support ticket endpoints
 */

import { Router } from 'express';
import { SupportController } from './support.controller';
import { validateBody, validateParams } from '@/shared/middleware/validator';
import { z } from 'zod';

const router = Router();
const controller = new SupportController();

/**
 * Validation schemas
 */
const ticketIdParamSchema = z.object({
  id: z.string().min(1, 'Ticket ID is required'),
});

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved']),
});

/**
 * Route definitions
 */

// GET /api/v1/support/stats - Get ticket statistics
router.get('/support/stats', controller.getTicketStats.bind(controller));

// GET /api/v1/support/tickets - Get all tickets
router.get('/support/tickets', controller.getAllTickets.bind(controller));

// GET /api/v1/support/tickets/:id - Get ticket by ID
router.get(
  '/support/tickets/:id',
  validateParams(ticketIdParamSchema),
  controller.getTicketById.bind(controller)
);

// POST /api/v1/support/tickets - Create new ticket
router.post(
  '/support/tickets',
  validateBody(createTicketSchema),
  controller.createTicket.bind(controller)
);

// PUT /api/v1/support/tickets/:id - Update ticket
router.put(
  '/support/tickets/:id',
  validateParams(ticketIdParamSchema),
  validateBody(updateTicketSchema),
  controller.updateTicket.bind(controller)
);

// DELETE /api/v1/support/tickets/:id - Delete ticket
router.delete(
  '/support/tickets/:id',
  validateParams(ticketIdParamSchema),
  controller.deleteTicket.bind(controller)
);

export default router;
