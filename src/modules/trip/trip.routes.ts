/**
 * Trip Routes
 * Defines HTTP routes for trip endpoints
 */

import { Router } from 'express';
import { TripController } from './trip.controller';
import { validateBody, validateParams } from '@/shared/middleware/validator';
import { z } from 'zod';

const router = Router();
const controller = new TripController();

/**
 * Validation schemas
 */
const idParamSchema = z.object({
  id: z.string().min(1, 'Trip ID is required'),
});

const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100),
  description: z.string().max(500).optional(),
  startDate: z.string(),
  endDate: z.string(),
  baseCurrency: z.string().length(3, 'Currency code must be 3 characters'),
  budget: z.number().positive('Budget must be positive'),
  participantIds: z.array(z.string()).min(1, 'At least one participant required'),
});

const updateTripSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(['planning', 'active', 'completed']).optional(),
});

/**
 * Route definitions
 */

// GET /api/v1/trips - Get all trips
router.get('/', controller.getAllTrips.bind(controller));

// GET /api/v1/trips/:id - Get trip by ID
router.get('/:id', validateParams(idParamSchema), controller.getTripById.bind(controller));

// POST /api/v1/trips - Create new trip
router.post('/', validateBody(createTripSchema), controller.createTrip.bind(controller));

// PUT /api/v1/trips/:id - Update trip
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateTripSchema),
  controller.updateTrip.bind(controller)
);

// DELETE /api/v1/trips/:id - Delete trip
router.delete('/:id', validateParams(idParamSchema), controller.deleteTrip.bind(controller));

// GET /api/v1/trips/:id/participants - Get trip participants
router.get(
  '/:id/participants',
  validateParams(idParamSchema),
  controller.getTripParticipants.bind(controller)
);

// POST /api/v1/trips/:id/complete - Complete trip with validation
router.post(
  '/:id/complete',
  validateParams(idParamSchema),
  controller.completeTrip.bind(controller)
);

// POST /api/v1/trips/:id/force-complete - Force complete trip without validation
router.post(
  '/:id/force-complete',
  validateParams(idParamSchema),
  controller.forceCompleteTrip.bind(controller)
);

export default router;
