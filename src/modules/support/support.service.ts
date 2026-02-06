/**
 * Support Service
 * Business logic for customer support ticket management
 */

import type { SupportTicket, CreateSupportTicketDto, UpdateSupportTicketDto } from '@/shared/types';
import { supportTickets } from '@/shared/data/mockDataStore';
import { generateTicketId } from '@/shared/utils/id.util';
import { getCurrentTimestamp } from '@/shared/utils/date.util';
import { createNotFoundError, createBadRequestError } from '@/shared/middleware/errorHandler';

/**
 * Service class handling support ticket business logic
 */
export class SupportService {
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
   */
  createTicket(dto: CreateSupportTicketDto): SupportTicket {
    if (!dto.subject || dto.subject.trim().length === 0) {
      throw createBadRequestError('Subject is required');
    }

    if (!dto.description || dto.description.trim().length === 0) {
      throw createBadRequestError('Description is required');
    }

    const newTicket: SupportTicket = {
      id: generateTicketId(),
      subject: dto.subject,
      description: dto.description,
      status: 'open',
      createdAt: getCurrentTimestamp(),
      lastUpdated: getCurrentTimestamp(),
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
