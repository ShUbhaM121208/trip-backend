/**
 * Vendor Controller
 * HTTP request handlers for vendor endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { VendorService } from './vendor.service';
import type { VendorCategory } from '@/shared/types';

const vendorService = new VendorService();

/**
 * GET /api/v1/vendors
 * Get all vendors with optional filters
 * 
 * Query parameters:
 * - location: string (optional) - Filter by city/region
 * - category: VendorCategory (optional) - Filter by vendor type
 * - verified: boolean (optional) - Show only verified vendors
 * - highlyRated: boolean (optional) - Show only 4.5+ rated vendors
 * 
 * Examples:
 * GET /api/v1/vendors
 * GET /api/v1/vendors?location=Paris
 * GET /api/v1/vendors?category=restaurant
 * GET /api/v1/vendors?location=Tokyo&category=hotel
 * GET /api/v1/vendors?verified=true
 */
export async function getAllVendors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { location, category, verified, highlyRated } = req.query;

    let vendors;

    if (verified === 'true') {
      vendors = vendorService.getVerifiedVendors(
        location as string,
        category as VendorCategory
      );
    } else if (highlyRated === 'true') {
      vendors = vendorService.getHighlyRatedVendors(
        location as string,
        category as VendorCategory
      );
    } else {
      vendors = vendorService.getAllVendors(
        location as string,
        category as VendorCategory
      );
    }

    res.json({
      success: true,
      data: { vendors },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/vendors/:id
 * Get vendor by ID
 */
export async function getVendorById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendor = vendorService.getVendorById(req.params.id as string);

    res.json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/vendors/location/:location
 * Get all vendors in a specific location
 */
export async function getVendorsByLocation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendors = vendorService.getVendorsByLocation(req.params.location as string);

    res.json({
      success: true,
      data: { vendors },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/vendors/category/:category
 * Get all vendors in a specific category
 */
export async function getVendorsByCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendors = vendorService.getVendorsByCategory(
      req.params.category as VendorCategory
    );

    res.json({
      success: true,
      data: { vendors },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/vendors/emergency/:location
 * Get emergency service vendors for a location
 */
export async function getEmergencyVendors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendors = vendorService.getEmergencyVendors(req.params.location as string);

    res.json({
      success: true,
      data: { vendors },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/vendors/search?service=keyword&location=city
 * Search vendors by service offered
 */
export async function searchVendorsByService(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { service, location } = req.query;

    if (!service) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Service parameter is required',
          statusCode: 400,
        },
      });
      return;
    }

    const vendors = vendorService.searchVendorsByService(
      service as string,
      location as string
    );

    res.json({
      success: true,
      data: { vendors },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/vendors/stats
 * Get vendor directory statistics
 */
export async function getVendorStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = vendorService.getVendorStats();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}
