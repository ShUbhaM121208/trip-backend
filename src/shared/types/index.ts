/**
 * Domain Types for Trip Companion Platform
 * Shared between frontend and backend
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  budget: number;
  totalSpent: number;
  participants: User[];
  status: 'planning' | 'active' | 'completed';
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: User;
  splitType: 'equal' | 'unequal' | 'percentage';
  splits: ExpenseSplit[];
  date: string;
  notes?: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
}

export type ExpenseCategory = 
  | 'accommodation'
  | 'transport'
  | 'food'
  | 'activities'
  | 'shopping'
  | 'other';

export interface Balance {
  userId: string;
  userName: string;
  amount: number;
}

export interface Settlement {
  from: User;
  to: User;
  amount: number;
  currency: string;
}

export interface BudgetCategory {
  category: ExpenseCategory;
  allocated: number;
  spent: number;
}

export interface LoyaltyInfo {
  score: number;
  tier: 'bronze' | 'silver' | 'gold';
  nextTierPoints: number;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  lastUpdated: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// DTO (Data Transfer Object) types for API requests
export interface CreateTripDto {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  budget: number;
  participantIds: string[];
}

export interface UpdateTripDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: 'planning' | 'active' | 'completed';
}

export interface CreateExpenseDto {
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidById: string;
  splitType: 'equal' | 'unequal' | 'percentage';
  splits: ExpenseSplit[];
  date: string;
  notes?: string;
}

export interface UpdateExpenseDto {
  title?: string;
  amount?: number;
  category?: ExpenseCategory;
  notes?: string;
}

export interface CreateSupportTicketDto {
  subject: string;
  description: string;
}

export interface UpdateSupportTicketDto {
  status?: 'open' | 'in-progress' | 'resolved';
}

export interface ChatMessageDto {
  content: string;
  tripId?: string;
}

export interface UpdateBudgetDto {
  categories: BudgetCategory[];
}
