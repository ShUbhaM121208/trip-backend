/**
 * Vendor Service
 * Business logic for vendor directory management
 * 
 * PURPOSE:
 * - Provide curated vendor recommendations to travelers
 * - Enable filtering by location and category
 * - Support verified vendor discovery
 * 
 * DESIGN DECISIONS:
 * - Simple filtering logic (no complex search algorithms yet)
 * - All vendors pre-verified during seeding
 * - Location matching is case-insensitive exact match
 * - Category filtering uses enum values
 * 
 * FUTURE ENHANCEMENTS:
 * - User reviews and ratings
 * - Booking integration
 * - Commission tracking for paid plans
 * - Vendor application and approval workflow
 * - Search by services offered
 * - Distance-based sorting (requires geolocation)
 */

import type { Vendor, VendorCategory } from '@/shared/types';
import { vendors, findVendorById } from '@/shared/data/mockDataStore';
import { createNotFoundError } from '@/shared/middleware/errorHandler';
import { VendorModel } from './vendor.model';

/**
 * Service class handling vendor business logic
 */
export class VendorService {
  /**
   * Get all vendors with optional filtering
   * 
   * @param location - Filter by city/region (case-insensitive)
   * @param category - Filter by vendor category
   * @returns Array of vendors matching filters
   * 
   * ALGORITHM:
   * 1. Start with all vendors
   * 2. Apply location filter if provided (case-insensitive)
   * 3. Apply category filter if provided
   * 4. Return filtered results
   * 
   * EXAMPLES:
   * - No filters: Returns all 30 vendors
   * - location='Paris': Returns 5 Paris vendors
   * - category='hotel': Returns 6 hotel vendors across all locations
   * - location='Tokyo', category='restaurant': Returns 1 vendor (Tsukiji Sushi Bar)
   */
  getAllVendors(location?: string, category?: VendorCategory): Vendor[] {
    let result = [...vendors];

    // Filter by location (case-insensitive)
    if (location) {
      result = result.filter(
        (v) => v.location.toLowerCase() === location.toLowerCase()
      );
    }

    // Filter by category
    if (category) {
      result = result.filter((v) => v.category === category);
    }

    return result;
  }

  /**
   * Get vendor by ID
   * 
   * @param id - Vendor identifier
   * @returns Vendor object
   * @throws NotFoundError if vendor doesn't exist
   */
  getVendorById(id: string): Vendor {
    const vendor = findVendorById(id);
    if (!vendor) {
      throw createNotFoundError('Vendor', id);
    }
    return vendor;
  }

  /**
   * Get verified vendors only
   * 
   * @param location - Optional location filter
   * @param category - Optional category filter
   * @returns Array of verified vendors
   * 
   * PURPOSE:
   * - Show only platform-approved vendors to users
   * - Build trust through verification badge
   * - Future: Implement verification workflow
   * 
   * VERIFICATION CRITERIA (Future):
   * - Business license verification
   * - Insurance coverage
   * - Customer review threshold (4.0+ rating)
   * - Response time < 24 hours
   * - Platform partnership agreement
   */
  getVerifiedVendors(location?: string, category?: VendorCategory): Vendor[] {
    const allVendors = this.getAllVendors(location, category);
    return allVendors.filter((v) => v.verified);
  }

  /**
   * Get vendors by location (convenience method)
   * 
   * @param location - City or region name
   * @returns All vendors in that location
   * 
   * SUPPORTED LOCATIONS:
   * - Paris (5 vendors)
   * - Tokyo (5 vendors)
   * - Bali (5 vendors)
   * - New York (5 vendors)
   * - London (5 vendors)
   * - Dubai (5 vendors)
   */
  getVendorsByLocation(location: string): Vendor[] {
    return this.getAllVendors(location);
  }

  /**
   * Get vendors by category (convenience method)
   * 
   * @param category - Vendor category
   * @returns All vendors in that category
   * 
   * CATEGORY DISTRIBUTION:
   * - hotel: 6 vendors (1 per location)
   * - restaurant: 6 vendors (1 per location)
   * - tour: 6 vendors (1 per location)
   * - transport: 6 vendors (1 per location)
   * - emergency: 6 vendors (1 per location)
   * - other: 0 vendors (reserved for future)
   */
  getVendorsByCategory(category: VendorCategory): Vendor[] {
    return this.getAllVendors(undefined, category);
  }

  /**
   * Get highly-rated vendors (4.5+ stars)
   * 
   * @param location - Optional location filter
   * @param category - Optional category filter
   * @returns Array of highly-rated vendors
   * 
   * PURPOSE:
   * - Highlight top-quality vendors
   * - Provide "best of" recommendations
   * - Build trust through social proof
   * 
   * RATING SYSTEM (Future):
   * - Aggregate user reviews
   * - Weight recent reviews higher
   * - Minimum 10 reviews for inclusion
   * - Remove outliers (very high/low)
   */
  getHighlyRatedVendors(location?: string, category?: VendorCategory): Vendor[] {
    const allVendors = this.getAllVendors(location, category);
    return allVendors.filter((v) => v.rating >= 4.5);
  }

  /**
   * Get emergency vendors (priority access)
   * 
   * @param location - City or region
   * @returns Emergency service vendors
   * 
   * PURPOSE:
   * - Quick access to medical/emergency services
   * - 24/7 availability
   * - Critical for traveler safety
   * 
   * FUTURE ENHANCEMENTS:
   * - Sort by distance from user
   * - Show current wait times
   * - Direct call integration
   * - Insurance compatibility check
   */
  getEmergencyVendors(location: string): Vendor[] {
    return this.getAllVendors(location, 'emergency');
  }

  /**
   * Search vendors by service offered
   * 
   * @param service - Service keyword to search
   * @param location - Optional location filter
   * @returns Vendors offering that service
   * 
   * ALGORITHM:
   * - Case-insensitive partial match on services array
   * - Returns vendors where any service contains keyword
   * 
   * EXAMPLES:
   * - service='wifi': Returns hotels offering WiFi
   * - service='cooking': Returns restaurants with cooking classes
   * - service='tour': Returns tour operators
   * 
   * FUTURE: Full-text search with relevance scoring
   */
  searchVendorsByService(service: string, location?: string): Vendor[] {
    const allVendors = this.getAllVendors(location);
    const serviceLower = service.toLowerCase();
    
    return allVendors.filter((vendor) =>
      vendor.services.some((s) => s.toLowerCase().includes(serviceLower))
    );
  }

  /**
   * Get vendor statistics
   * 
   * @returns Aggregate statistics about vendor directory
   * 
   * PURPOSE:
   * - Admin dashboard insights
   * - Platform growth metrics
   * - Vendor distribution analysis
   */
  getVendorStats(): {
    total: number;
    byCategory: Record<VendorCategory, number>;
    byLocation: Record<string, number>;
    verifiedCount: number;
    averageRating: number;
  } {
    const byCategory: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    let totalRating = 0;

    vendors.forEach((vendor) => {
      // Count by category
      byCategory[vendor.category] = (byCategory[vendor.category] || 0) + 1;

      // Count by location
      byLocation[vendor.location] = (byLocation[vendor.location] || 0) + 1;

      // Sum ratings
      totalRating += vendor.rating;
    });

    return {
      total: vendors.length,
      byCategory: byCategory as Record<VendorCategory, number>,
      byLocation,
      verifiedCount: vendors.filter((v) => v.verified).length,
      averageRating: totalRating / vendors.length,
    };
  }
}
