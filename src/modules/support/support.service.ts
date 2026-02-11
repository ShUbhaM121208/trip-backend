/**
 * Support Service
 * Business logic for customer support ticket management and plan eligibility
 */

import type { SupportTicket, CreateSupportTicketDto, UpdateSupportTicketDto } from '@/shared/types';
import { supportTickets, findUserById } from '@/shared/data/mockDataStore';
import { generateTicketId } from '@/shared/utils/id.util';
import { getCurrentTimestamp } from '@/shared/utils/date.util';
import { createNotFoundError, createBadRequestError } from '@/shared/middleware/errorHandler';

/**
 * Service class handling support ticket business logic
 */
export class SupportService {
  /**
   * Validate plan eligibility for human support
   * 
   * @param userId - User identifier
   * @returns true if eligible, throws error otherwise
   * @throws BadRequestError if user not found or ineligible
   * 
   * PURPOSE:
   * - Enforce subscription tier restrictions
   * - Ensure paid plans get human agent support
   * - Free users directed to AI support only
   * 
   * PLAN FEATURES:
   * - Free: AI support only (no human escalation)
   * - Basic: Human support with 24-hour SLA
   * - Premium: Priority human support with 4-hour SLA
   * 
   * VALIDATION RULES:
   * 1. User must exist in system
   * 2. Subscription tier must be 'basic' or 'premium'
   * 3. Subscription must not be expired
   * 
   * ERROR MESSAGES:
   * - User not found: User lookup failed
   * - Free tier: "Human support requires Basic plan or higher"
   * - Expired subscription: "Subscription expired - please renew"
   * 
   * FUTURE ENHANCEMENTS:
   * - Grace period after expiry (7 days)
   * - Trial access for new users (14 days)
   * - One-time emergency support for free tier
   * - Partner tier with custom SLA
   */
  validatePlanEligibility(userId: string): boolean {
    const user = findUserById(userId);
    
    if (!user) {
      throw createNotFoundError('User', userId);
    }

    // Check subscription tier
    if (!user.subscriptionTier || user.subscriptionTier === 'free') {
      throw createBadRequestError(
        'Human support requires Basic plan or higher. Upgrade your plan to access human agent support.'
      );
    }

    // Check subscription expiry
    if (user.subscriptionExpiry) {
      const expiryDate = new Date(user.subscriptionExpiry);
      const now = new Date();
      
      if (expiryDate < now) {
        throw createBadRequestError(
          'Your subscription has expired. Please renew to access human support.'
        );
      }
    }

    return true;
  }

  /**
   * Get all support tickets
   */
  getAllTickets(status?: 'open' | 'in-progress' | 'resolved'): SupportTicket[] {
    if (status) {
      return supportTickets.filter((ticket) => ticket.status === status);
    }
    return supportTickets;
  }

  /**
   * Get ticket by ID
   */
  getTicketById(id: string): SupportTicket {
    const ticket = supportTickets.find((t) => t.id === id);
    if (!ticket) {
      throw createNotFoundError('Support Ticket', id);
    }
    return ticket;
  }

  /**
   * Create new support ticket
   * 
   * Enhanced with plan eligibility validation for human escalation.
   * 
   * PLAN-BASED ACCESS CONTROL:
   * - escalateToHuman=true: Requires Basic/Premium plan, validates eligibility
   * - escalateToHuman=false/undefined: AI support for all tiers (free included)
   * 
   * SLA BY TIER:
   * - Premium: 4-hour human response time
   * - Basic: 24-hour human response time
   * - Free: AI support only (no response time guarantee)
   * 
   * WORKFLOW:
   * 1. Validate required fields (subject, description, userId)
   * 2. If escalateToHuman requested:
   *    a. Validate user's plan eligibility
   *    b. Set escalatedToHuman=true
   *    c. Set responseTime based on subscription tier
   * 3. Create ticket with appropriate fields
   * 4. Return ticket to user
   */
  createTicket(dto: CreateSupportTicketDto): SupportTicket {
    if (!dto.subject || dto.subject.trim().length === 0) {
      throw createBadRequestError('Subject is required');
    }

    if (!dto.description || dto.description.trim().length === 0) {
      throw createBadRequestError('Description is required');
    }

    if (!dto.userId) {
      throw createBadRequestError('User ID is required');
    }

    // Validate plan eligibility if human escalation requested
    let responseTime: string | undefined;
    let escalatedToHuman = false;

    if (dto.escalateToHuman) {
      this.validatePlanEligibility(dto.userId);
      escalatedToHuman = true;

      // Set response time based on subscription tier
      const user = findUserById(dto.userId);
      responseTime = user?.subscriptionTier === 'premium' ? '4 hours' : '24 hours';
    }

    const newTicket: SupportTicket = {
      id: generateTicketId(),
      subject: dto.subject,
      description: dto.description,
      status: 'open',
      createdAt: getCurrentTimestamp(),
      lastUpdated: getCurrentTimestamp(),
      userId: dto.userId,
      escalatedToHuman,
      responseTime,
    };

    supportTickets.push(newTicket);
    return newTicket;
  }

  /**
   * Update existing ticket
   */
  updateTicket(id: string, dto: UpdateSupportTicketDto): SupportTicket {
    const ticket = supportTickets.find((t) => t.id === id);
    if (!ticket) {
      throw createNotFoundError('Support Ticket', id);
    }

    // Update status if provided
    if (dto.status) {
      ticket.status = dto.status;
      ticket.lastUpdated = getCurrentTimestamp();
    }

    return ticket;
  }

  /**
   * Delete ticket
   */
  deleteTicket(id: string): void {
    const index = supportTickets.findIndex((t) => t.id === id);
    if (index === -1) {
      throw createNotFoundError('Support Ticket', id);
    }
    supportTickets.splice(index, 1);
  }

  /**
   * Get ticket statistics
   */
  getTicketStats(): {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  } {
    return {
      total: supportTickets.length,
      open: supportTickets.filter((t) => t.status === 'open').length,
      inProgress: supportTickets.filter((t) => t.status === 'in-progress').length,
      resolved: supportTickets.filter((t) => t.status === 'resolved').length,
    };
  }
}
