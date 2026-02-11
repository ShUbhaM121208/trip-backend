/**
 * Vendor Model
 * Domain model for Vendor entity
 */

import type { Vendor } from '@/shared/types';

export class VendorModel {
  id: string;
  name: string;
  category: 'hotel' | 'restaurant' | 'tour' | 'transport' | 'emergency' | 'other';
  location: string;
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  rating: number;
  verified: boolean;
  services: string[];
  priceRange: '$' | '$$' | '$$$';
  description?: string;

  constructor(vendor: Vendor) {
    this.id = vendor.id;
    this.name = vendor.name;
    this.category = vendor.category;
    this.location = vendor.location;
    this.contact = vendor.contact;
    this.rating = vendor.rating;
    this.verified = vendor.verified;
    this.services = vendor.services;
    this.priceRange = vendor.priceRange;
    this.description = vendor.description;
  }

  /**
   * Convert model to plain object
   */
  toJSON(): Vendor {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      location: this.location,
      contact: this.contact,
      rating: this.rating,
      verified: this.verified,
      services: this.services,
      priceRange: this.priceRange,
      description: this.description,
    };
  }

  /**
   * Check if vendor is highly rated
   */
  isHighlyRated(): boolean {
    return this.rating >= 4.5;
  }

  /**
   * Check if vendor offers a specific service
   */
  offersService(service: string): boolean {
    return this.services.some(s => s.toLowerCase().includes(service.toLowerCase()));
  }
}
