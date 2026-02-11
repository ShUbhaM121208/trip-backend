/**
 * Trip Controller
 * Handles HTTP requests for trip endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { TripService } from './trip.service';
import { getParam } from '@/shared/utils/request.util';

const tripService = new TripService();

/**
 * Controller class for trip endpoints
 */
export class TripController {
  /**
   * GET /api/v1/trips
   * Get all trips
   */
  async getAllTrips(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trips = tripService.getAllTrips();
      res.json({
        success: true,
        data: { trips },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/:id
   * Get trip by ID
   */
  async getTripById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = tripService.getTripById(getParam(req, 'id'));
      res.json({
        success: true,
        data: { trip },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/trips
   * Create new trip
   */
  async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = tripService.createTrip(req.body);
      res.status(201).json({
        success: true,
        data: { trip },
        message: 'Trip created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/trips/:id
   * Update existing trip
   */
  async updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = tripService.updateTrip(getParam(req, 'id'), req.body);
      res.json({
        success: true,
        data: { trip },
        message: 'Trip updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/trips/:id
   * Delete trip
   */
  async deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      tripService.deleteTrip(getParam(req, 'id'));
      res.json({
        success: true,
        message: 'Trip deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/:id/participants
   * Get trip participants
   */
  async getTripParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const participants = tripService.getTripParticipants(getParam(req, 'id'));
      res.json({
        success: true,
        data: { participants },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/trips/:id/complete
   * Complete trip with validation
   */
  async completeTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = tripService.completeTrip(getParam(req, 'id'));
      res.json({
        success: true,
        data: { trip },
        message: 'Trip completed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/trips/:id/force-complete
   * Force complete trip without validation
   */
  async forceCompleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = tripService.forceCompleteTrip(getParam(req, 'id'));
      res.json({
        success: true,
        data: { trip },
        message: 'Trip force completed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
