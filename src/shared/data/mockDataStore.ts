/**
 * In-Memory Data Store
 * Manages application data using JavaScript arrays
 * Note: Data is reset on server restart
 */

import type {
  User,
  Trip,
  Expense,
  BudgetCategory,
  LoyaltyInfo,
  SupportTicket,
  ChatMessage,
} from '../types';

/**
 * Mock Users Database
 */
export const users: User[] = [
  { id: 'u1', name: 'Alex Chen', email: 'alex@example.com' },
  { id: 'u2', name: 'Sarah Kim', email: 'sarah@example.com' },
  { id: 'u3', name: 'Mike Johnson', email: 'mike@example.com' },
  { id: 'u4', name: 'Emma Davis', email: 'emma@example.com' },
];

/**
 * Mock Trips Database
 */
export const trips: Trip[] = [
  {
    id: 't1',
    name: 'Tokyo Adventure',
    description: "Exploring Japan's capital",
    startDate: '2024-03-15',
    endDate: '2024-03-25',
    baseCurrency: 'USD',
    budget: 5000,
    totalSpent: 3850,
    participants: [users[0], users[1], users[2]],
    status: 'active',
  },
  {
    id: 't2',
    name: 'Paris Weekend',
    description: 'Romantic getaway',
    startDate: '2024-04-01',
    endDate: '2024-04-05',
    baseCurrency: 'EUR',
    budget: 2000,
    totalSpent: 1200,
    participants: [users[0], users[1]],
    status: 'planning',
  },
  {
    id: 't3',
    name: 'Barcelona Summer',
    description: 'Beach and culture trip',
    startDate: '2024-06-10',
    endDate: '2024-06-20',
    baseCurrency: 'EUR',
    budget: 4500,
    totalSpent: 4800,
    participants: users,
    status: 'completed',
  },
];

/**
 * Mock Expenses Database
 */
export const expenses: Expense[] = [
  {
    id: 'e1',
    tripId: 't1',
    title: 'Hotel - Shinjuku',
    amount: 1200,
    currency: 'USD',
    category: 'accommodation',
    paidBy: users[0],
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 400 },
      { userId: 'u2', amount: 400 },
      { userId: 'u3', amount: 400 },
    ],
    date: '2024-03-15',
  },
  {
    id: 'e2',
    tripId: 't1',
    title: 'Sushi Dinner at Tsukiji',
    amount: 180,
    currency: 'USD',
    category: 'food',
    paidBy: users[1],
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 60 },
      { userId: 'u2', amount: 60 },
      { userId: 'u3', amount: 60 },
    ],
    date: '2024-03-16',
  },
  {
    id: 'e3',
    tripId: 't1',
    title: 'JR Pass',
    amount: 750,
    currency: 'USD',
    category: 'transport',
    paidBy: users[0],
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 250 },
      { userId: 'u2', amount: 250 },
      { userId: 'u3', amount: 250 },
    ],
    date: '2024-03-15',
  },
  {
    id: 'e4',
    tripId: 't1',
    title: 'TeamLab Borderless Tickets',
    amount: 120,
    currency: 'USD',
    category: 'activities',
    paidBy: users[2],
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 40 },
      { userId: 'u2', amount: 40 },
      { userId: 'u3', amount: 40 },
    ],
    date: '2024-03-17',
  },
  {
    id: 'e5',
    tripId: 't1',
    title: 'Souvenirs from Akihabara',
    amount: 350,
    currency: 'USD',
    category: 'shopping',
    paidBy: users[1],
    splitType: 'unequal',
    splits: [
      { userId: 'u1', amount: 150 },
      { userId: 'u2', amount: 120 },
      { userId: 'u3', amount: 80 },
    ],
    date: '2024-03-18',
  },
  {
    id: 'e6',
    tripId: 't1',
    title: 'Ramen Lunch',
    amount: 45,
    currency: 'USD',
    category: 'food',
    paidBy: users[2],
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 15 },
      { userId: 'u2', amount: 15 },
      { userId: 'u3', amount: 15 },
    ],
    date: '2024-03-16',
  },
];

/**
 * Mock Budget Categories Database (per trip)
 * Key format: tripId
 */
export const budgetCategories: Map<string, BudgetCategory[]> = new Map([
  [
    't1',
    [
      { category: 'accommodation', allocated: 1500, spent: 1200 },
      { category: 'transport', allocated: 1000, spent: 750 },
      { category: 'food', allocated: 800, spent: 645 },
      { category: 'activities', allocated: 600, spent: 520 },
      { category: 'shopping', allocated: 700, spent: 350 },
      { category: 'other', allocated: 400, spent: 385 },
    ],
  ],
]);

/**
 * Mock Loyalty Database (per user)
 * Key format: userId
 */
export const loyaltyData: Map<string, LoyaltyInfo> = new Map([
  [
    'u1',
    {
      score: 2450,
      tier: 'silver',
      nextTierPoints: 5000,
    },
  ],
  [
    'u2',
    {
      score: 1200,
      tier: 'bronze',
      nextTierPoints: 2500,
    },
  ],
]);

/**
 * Mock Support Tickets Database
 */
export const supportTickets: SupportTicket[] = [
  {
    id: 'ticket-1',
    subject: 'Currency conversion issue',
    description: 'Unable to convert JPY to USD correctly',
    status: 'resolved',
    createdAt: '2024-03-10T10:00:00Z',
    lastUpdated: '2024-03-12T15:30:00Z',
  },
  {
    id: 'ticket-2',
    subject: 'Unable to add participant',
    description: 'Getting error when trying to add new user to trip',
    status: 'in-progress',
    createdAt: '2024-03-18T09:15:00Z',
    lastUpdated: '2024-03-19T11:20:00Z',
  },
];

/**
 * Mock Chat History Database (per trip or global)
 * Key format: tripId or 'global'
 */
export const chatHistory: Map<string, ChatMessage[]> = new Map([
  [
    't1',
    [
      {
        id: 'msg-1',
        role: 'user',
        content: 'What is our current expense breakdown?',
        timestamp: '2024-03-19T10:30:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content:
          "Here's your expense breakdown for Tokyo Adventure:\n\n• Accommodation: $1,200 (31%)\n• Transport: $750 (19%)\n• Food: $645 (17%)\n• Activities: $520 (14%)\n• Shopping: $350 (9%)\n• Other: $385 (10%)\n\nTotal: $3,850 of $5,000 budget (77% used)",
        timestamp: '2024-03-19T10:30:05Z',
      },
    ],
  ],
]);

/**
 * Helper function to find user by ID
 */
export function findUserById(userId: string): User | undefined {
  return users.find((u) => u.id === userId);
}

/**
 * Helper function to find trip by ID
 */
export function findTripById(tripId: string): Trip | undefined {
  return trips.find((t) => t.id === tripId);
}

/**
 * Helper function to find expense by ID
 */
export function findExpenseById(expenseId: string): Expense | undefined {
  return expenses.find((e) => e.id === expenseId);
}
