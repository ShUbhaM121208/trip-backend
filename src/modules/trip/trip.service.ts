/**
 * Trip Service
 * Business logic for trip management
 */

import type { Trip, CreateTripDto, UpdateTripDto, User } from '@/shared/types';
import { trips, users, expenses, findUserById } from '@/shared/data/mockDataStore';
import { generateTripId } from '@/shared/utils/id.util';
import { isValidDate, isValidDateRange } from '@/shared/utils/date.util';
import { round } from '@/shared/utils/rounding.util';
import { convertCurrency } from '@/shared/utils/currency.util';
import {
  createNotFoundError,
  createBadRequestError,
} from '@/shared/middleware/errorHandler';
import { TripModel } from './trip.model';

/**
 * Service class handling trip business logic
 */
export class TripService {
  /**
   * Get all trips
   */
  getAllTrips(): Trip[] {
    return trips.map((trip) => this.calculateTotalSpent(trip));
  }

  /**
   * Get trip by ID
   */
  getTripById(id: string): Trip {
    const trip = trips.find((t) => t.id === id);
    if (!trip) {
      throw createNotFoundError('Trip', id);
    }
    return this.calculateTotalSpent(trip);
  }

  /**
   * Create new trip
   */
  createTrip(dto: CreateTripDto): Trip {
    // Validate dates
    if (!isValidDate(dto.startDate) || !isValidDate(dto.endDate)) {
      throw createBadRequestError('Invalid date format. Use ISO 8601 format.');
    }

    if (!isValidDateRange(dto.startDate, dto.endDate)) {
      throw createBadRequestError('End date must be after or equal to start date');
    }

    // Validate budget
    if (dto.budget <= 0) {
      throw createBadRequestError('Budget must be greater than 0');
    }

    // Validate participants
    const participants: User[] = [];
    for (const participantId of dto.participantIds) {
      const user = findUserById(participantId);
      if (!user) {
        throw createNotFoundError('User', participantId);
      }
      participants.push(user);
    }

    if (participants.length === 0) {
      throw createBadRequestError('Trip must have at least one participant');
    }

    // Create new trip
    const newTrip: Trip = {
      id: generateTripId(),
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      baseCurrency: dto.baseCurrency,
      budget: dto.budget,
      totalSpent: 0,
      participants,
      status: 'planning',
    };

    trips.push(newTrip);
    return newTrip;
  }

  /**
   * Update existing trip
   */
  updateTrip(id: string, dto: UpdateTripDto): Trip {
    const trip = trips.find((t) => t.id === id);
    if (!trip) {
      throw createNotFoundError('Trip', id);
    }

    // Validate dates if provided
    if (dto.startDate && !isValidDate(dto.startDate)) {
      throw createBadRequestError('Invalid start date format');
    }

    if (dto.endDate && !isValidDate(dto.endDate)) {
      throw createBadRequestError('Invalid end date format');
    }

    const startDate = dto.startDate || trip.startDate;
    const endDate = dto.endDate || trip.endDate;

    if (!isValidDateRange(startDate, endDate)) {
      throw createBadRequestError('End date must be after or equal to start date');
    }

    // Validate budget if provided
    if (dto.budget !== undefined && dto.budget <= 0) {
      throw createBadRequestError('Budget must be greater than 0');
    }

    // Update fields
    if (dto.name) trip.name = dto.name;
    if (dto.description !== undefined) trip.description = dto.description;
    if (dto.startDate) trip.startDate = dto.startDate;
    if (dto.endDate) trip.endDate = dto.endDate;
    if (dto.budget) trip.budget = dto.budget;
    if (dto.status) trip.status = dto.status;

    return this.calculateTotalSpent(trip);
  }

  /**
   * Delete trip
   */
  deleteTrip(id: string): void {
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) {
      throw createNotFoundError('Trip', id);
    }

    // Also delete associated expenses
    const expenseIndices = expenses
      .map((e, i) => (e.tripId === id ? i : -1))
      .filter((i) => i !== -1)
      .reverse();

    expenseIndices.forEach((i) => expenses.splice(i, 1));

    trips.splice(index, 1);
  }

  /**
   * Get trip participants
   */
  getTripParticipants(id: string): User[] {
    const trip = trips.find((t) => t.id === id);
    if (!trip) {
      throw createNotFoundError('Trip', id);
    }
    return trip.participants;
  }

  /**
   * Calculate total spent for a trip
   * Sums up all expenses and converts to base currency
   */
  private calculateTotalSpent(trip: Trip): Trip {
    const tripExpenses = expenses.filter((e) => e.tripId === trip.id);

    const totalSpent = tripExpenses.reduce((sum, expense) => {
      // Convert expense amount to trip's base currency
      const convertedAmount = convertCurrency(
        expense.amount,
        expense.currency,
        trip.baseCurrency
      );
      return sum + convertedAmount;
    }, 0);

    trip.totalSpent = round(totalSpent);
    return trip;
  }
}
