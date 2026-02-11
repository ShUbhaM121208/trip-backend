/**
 * Vendor Routes
 * API endpoints for vendor directory
 */

import { Router } from 'express';
import * as vendorController from './vendor.controller';

const router = Router();

/**
 * GET /api/v1/vendors/stats
 * Get vendor statistics
 * Must be before /:id to avoid treating 'stats' as ID
 */
router.get('/stats', vendorController.getVendorStats);

/**
 * GET /api/v1/vendors/search
 * Search vendors by service
 */
router.get('/search', vendorController.searchVendorsByService);

/**
 * GET /api/v1/vendors/location/:location
 * Get vendors by location
 */
router.get('/location/:location', vendorController.getVendorsByLocation);

/**
 * GET /api/v1/vendors/category/:category
 * Get vendors by category
 */
router.get('/category/:category', vendorController.getVendorsByCategory);

/**
 * GET /api/v1/vendors/emergency/:location
 * Get emergency vendors for location
 */
router.get('/emergency/:location', vendorController.getEmergencyVendors);

/**
 * GET /api/v1/vendors/:id
 * Get vendor by ID
 */
router.get('/:id', vendorController.getVendorById);

/**
 * GET /api/v1/vendors
 * Get all vendors (with optional filters)
 */
router.get('/', vendorController.getAllVendors);

export default router;
