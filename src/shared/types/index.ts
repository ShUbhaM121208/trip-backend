/**
 * Domain Types for Trip Companion Platform
 * Shared between frontend and backend
 * 
 * DESIGN PHILOSOPHY:
 * - Simple, normalized domain models focused on business entities
 * - No circular dependencies between entities
 * - Enums for controlled vocabularies to prevent invalid states
 * - ISO 8601 date strings for timezone safety and JSON serialization
 * - Currency codes follow ISO 4217 standard (3-letter codes)
 * 
 * PERSISTENCE STRATEGY:
 * Current: In-memory storage using JavaScript arrays/Maps (development only)
 * Future: PostgreSQL with Prisma ORM for production
 * Migration Path: Services already abstract data access, minimal refactoring needed
 * 
 * ID STRATEGY:
 * Current: Timestamp-based IDs (generateId() utility) for simplicity
 * Future: UUIDs (v4) for distributed systems and security
 * Why change: UUIDs prevent ID prediction and support horizontal scaling
 */

/**
 * USER ENTITY
 * 
 * Represents a person who can participate in trips and create expenses.
 * 
 * Why this exists:
 * - Central identity for all platform interactions
 * - Enables expense tracking per person
 * - Foundation for future authentication system
 * 
 * Design decisions:
 * - email is required but not validated (no auth yet)
 * - avatarUrl is optional (defaults to initials-based avatar in UI)
 * - No password field (authentication not implemented)
 * - No role/permissions (authorization future work)
 * 
 * Future enhancements:
 * - Add authentication (passwordHash, salt, tokens)
 * - Add profile fields (phone, preferences, timezone)
 * - Add privacy settings (profile visibility, data sharing)
 * - Implement soft delete (isActive, deletedAt)
 */
export interface User {
  id: string;           // Unique identifier (currently timestamp-based, migrate to UUID)
  name: string;         // Display name (no length validation yet)
  email: string;        // Email address (unique, no verification yet)
  avatarUrl?: string;   // Optional profile picture URL
}

/**
 * TRIP ENTITY
 * 
 * Represents a shared trip where multiple users track expenses together.
 * Central aggregation point for all trip-related data.
 * 
 * Why this exists:
 * - Groups expenses under a single context
 * - Defines currency for balance calculations
 * - Tracks overall budget vs actual spending
 * - Manages trip lifecycle (planning → active → completed)
 * 
 * Design decisions:
 * - participants is denormalized (embedded User objects) for read performance
 *   Future DB: Use join table trip_participants with userId foreign key
 * - baseCurrency is immutable after creation (changing would invalidate all balances)
 * - totalSpent is computed field (sum of all expenses), not persisted separately
 * - status transitions: planning → active (manual) → completed (manual)
 * - budget is optional guidance, not enforced constraint
 * 
 * Relationships:
 * - Has many Expenses (1:N)
 * - Has many Participants via User (M:N through participants array)
 * - Has one BudgetPlan (1:1, not yet modeled separately)
 * 
 * Future enhancements:
 * - Add trip visibility (private, shared, public)
 * - Add trip template support (reuse structure)
 * - Add trip invitations (pending, accepted, declined)
 * - Add trip cover image
 * - Auto-transition to 'completed' when endDate passes
 */
export interface Trip {
  id: string;                 // Unique identifier
  name: string;               // Trip name (e.g., "Bali Adventure 2025")
  description?: string;       // Optional trip description
  startDate: string;          // ISO 8601 date (YYYY-MM-DD)
  endDate: string;            // ISO 8601 date (must be >= startDate)
  baseCurrency: string;       // ISO 4217 currency code (USD, EUR, etc.)
  budget: number;             // Total budget in baseCurrency (positive number)
  totalSpent: number;         // Computed: sum of all expenses (converted to baseCurrency)
  participants: User[];       // Denormalized user list (migrate to IDs + join)
  status: TripStatus;         // Lifecycle state
}

/**
 * TRIP STATUS ENUM
 * 
 * Defines the lifecycle of a trip.
 * 
 * Why this exists:
 * - Controls which operations are allowed (e.g., no expense edits after completion)
 * - Enables filtering (show only active trips)
 * - Supports analytics (completed trips over time)
 * 
 * States:
 * - planning: Trip created but not started (can modify anything)
 * - active: Trip in progress (expenses being added)
 * - completed: Trip finished (read-only, settlements finalized)
 * 
 * Transitions:
 * - planning → active (manual trigger or auto on startDate)
 * - active → completed (manual trigger or auto on endDate + 7 days)
 * - No backwards transitions (completed trips stay completed)
 */
export type TripStatus = 'planning' | 'active' | 'completed';

/**
 * EXPENSE ENTITY
 * 
 * Represents a single payment made by one person that is split among multiple participants.
 * Core entity for expense tracking and balance calculation.
 * 
 * Why this exists:
 * - Records who paid for what
 * - Tracks how costs are divided among participants
 * - Enables balance and settlement calculations
 * - Provides expense analytics by category
 * 
 * Design decisions:
 * - paidBy is denormalized (full User object) for UI performance
 *   Future DB: Store paidById and join on read
 * - currency can differ from trip.baseCurrency (multi-currency support)
 * - splits array always matches splitType logic (validated on create/update)
 * - date is separate from createdAt (expense date vs record creation)
 * - amount is gross amount before splits (splits must sum to amount)
 * 
 * Split logic:
 * - equal: splits calculated as amount / participant count
 * - unequal: splits provided explicitly (must sum to amount)
 * - percentage: splits calculated from percentages (must sum to 100%)
 * 
 * Relationships:
 * - Belongs to Trip (N:1)
 * - Has many ExpenseSplits (1:N, embedded)
 * - Paid by one User (N:1)
 * - Split among many Users via ExpenseSplit (M:N)
 * 
 * Future enhancements:
 * - Add receipt attachment (receiptUrl, receiptType)
 * - Add expense approval workflow (status: pending, approved, rejected)
 * - Add recurring expense support (frequency, endDate)
 * - Add expense tags (custom categorization)
 * - Add geolocation (lat, lng, location name)
 */
export interface Expense {
  id: string;                   // Unique identifier
  tripId: string;               // Foreign key to Trip
  title: string;                // Expense description (e.g., "Hotel Hilton")
  amount: number;               // Total amount in specified currency (positive)
  currency: string;             // ISO 4217 currency code (can differ from trip currency)
  category: ExpenseCategory;    // Expense classification
  paidBy: User;                 // Person who made the payment (denormalized)
  splitType: SplitType;         // How the expense is divided
  splits: ExpenseSplit[];       // Individual split allocations
  date: string;                 // ISO 8601 date when expense occurred
  notes?: string;               // Optional additional context
}

/**
 * EXPENSE SPLIT ENTITY
 * 
 * Represents one person's share of an expense.
 * Embedded within Expense (not a separate table).
 * 
 * Why this exists:
 * - Tracks individual liability for an expense
 * - Enables balance calculation per user
 * - Supports flexible split types (equal, unequal, percentage)
 * 
 * Design decisions:
 * - amount is always in expense currency (converted later for balances)
 * - percentage is optional (only used for percentage split type)
 * - userId references User (not denormalized to reduce data duplication)
 * - No split ID (identified by userId within expense)
 * 
 * Validation rules:
 * - sum(splits.amount) must equal expense.amount (within 0.01 tolerance)
 * - sum(splits.percentage) must equal 100 for percentage splits
 * - userId must be a trip participant
 * - amount must be >= 0
 * 
 * Future enhancements:
 * - Add split notes (why this person pays this amount)
 * - Add split approval (participant confirms their share)
 * - Add split adjustments (modify split after expense creation)
 */
export interface ExpenseSplit {
  userId: string;       // User responsible for this split
  amount: number;       // Split amount in expense currency (2 decimal precision)
  percentage?: number;  // Optional: percentage for percentage split type (0-100)
}

/**
 * SPLIT TYPE ENUM
 * 
 * Defines how an expense is divided among participants.
 * 
 * Why this exists:
 * - Different expenses require different splitting logic
 * - UI can show appropriate input controls per type
 * - Validation rules differ per type
 * 
 * Types:
 * - equal: Divide amount equally (n splits = amount / n)
 * - unequal: Custom amounts per person (must sum to total)
 * - percentage: Define percentage per person (must sum to 100%)
 * 
 * Implementation:
 * - Splitting logic in expense.service.ts: calculateSplits()
 * - Rounding handled by adjustSplitsForRounding() utility
 * - Multi-currency handled by convertCurrency() utility
 * 
 * Future types:
 * - shares: Weighted distribution (e.g., 2:1:1 ratio)
 * - adjustment: Manual override of calculated splits
 * - itemized: Different people pay for different items
 */
export type SplitType = 'equal' | 'unequal' | 'percentage';

/**
 * EXPENSE CATEGORY ENUM
 * 
 * Classifies expenses for budgeting and analytics.
 * 
 * Why this exists:
 * - Enables budget allocation per category
 * - Supports expense analytics and reporting
 * - Helps users understand spending patterns
 * 
 * Categories:
 * - accommodation: Hotels, Airbnb, lodging
 * - transport: Flights, trains, taxis, car rentals
 * - food: Restaurants, groceries, drinks
 * - activities: Tours, tickets, entertainment
 * - shopping: Souvenirs, personal purchases
 * - other: Miscellaneous expenses
 * 
 * Design decisions:
 * - Fixed set of 6 categories (not customizable yet)
 * - 'other' as catch-all for uncategorized expenses
 * - No hierarchy (no subcategories)
 * 
 * Budget allocation:
 * Default percentages: accommodation(30%), transport(20%), food(20%), 
 * activities(15%), shopping(10%), other(5%)
 * 
 * Future enhancements:
 * - Allow custom categories per trip
 * - Add category icons/colors
 * - Add category hierarchy (transport → flights → domestic)
 * - Add category budgets with alerts
 */
export type ExpenseCategory = 
  | 'accommodation'
  | 'transport'
  | 'food'
  | 'activities'
  | 'shopping'
  | 'other';

/**
 * BALANCE ENTITY (DERIVED)
 * 
 * Represents a participant's net balance in a trip.
 * This is a computed entity, NOT persisted in database.
 * 
 * Why this exists:
 * - Shows who owes money vs who should receive money
 * - Drives settlement calculation
 * - Provides financial summary per user
 * 
 * Calculation:
 * balance = totalPaid - totalOwed
 * - totalPaid: sum of all expenses where user is payer
 * - totalOwed: sum of all expense splits for user
 * - All amounts converted to trip baseCurrency
 * 
 * Interpretation:
 * - Positive balance: User is owed money (creditor)
 * - Negative balance: User owes money (debtor)
 * - Zero balance: User is settled up
 * 
 * Computed by: settlement.service.ts: calculateBalances()
 * 
 * Design decisions:
 * - Stored as amount only (currency is always trip.baseCurrency)
 * - userName denormalized for UI convenience
 * - Balances < 0.01 treated as zero (rounding tolerance)
 * 
 * Future enhancements:
 * - Add balance history (balance over time)
 * - Add balance breakdown (per category, per person)
 * - Add balance projections (based on budget)
 */
export interface Balance {
  userId: string;       // User this balance belongs to
  userName: string;     // Denormalized for display (avoid extra lookup)
  amount: number;       // Net balance in trip baseCurrency (can be negative)
}

/**
 * SETTLEMENT ENTITY (DERIVED)
 * 
 * Represents a recommended payment to settle trip balances.
 * This is a computed entity, NOT persisted (no payment tracking yet).
 * 
 * Why this exists:
 * - Simplifies settling up after a trip
 * - Minimizes number of transactions needed
 * - Provides clear payment instructions
 * 
 * Algorithm:
 * Greedy approach that matches largest debtor with largest creditor.
 * Optimizes for minimal transaction count, not minimal total amount.
 * 
 * Example:
 * Balances: Alex(+$485), Sarah(-$235), Mike(-$250)
 * Settlements: Mike → Alex ($250), Sarah → Alex ($235)
 * Result: 2 transactions instead of potentially more
 * 
 * Computed by: settlement.service.ts: suggestSettlements()
 * 
 * Design decisions:
 * - Full User objects denormalized (from/to) for UI display
 * - Currency is always trip.baseCurrency
 * - Settlements < 0.01 are ignored (rounding tolerance)
 * - No partial settlement tracking (future: track payments made)
 * 
 * Limitations:
 * - Greedy algorithm is not always globally optimal
 * - No consideration of payment preferences (who pays whom)
 * - No external payment integration (Venmo, PayPal, etc.)
 * 
 * Future enhancements:
 * - Track settlement status (pending, completed)
 * - Add payment proof (receipt, transaction ID)
 * - Integrate payment APIs for direct settlement
 * - Allow manual settlement adjustments
 * - Consider payment graph algorithms for complex scenarios
 */
export interface Settlement {
  from: User;           // Debtor (person making payment)
  to: User;             // Creditor (person receiving payment)
  amount: number;       // Payment amount in trip currency (positive)
  currency: string;     // Always trip.baseCurrency (included for clarity)
}

/**
 * BUDGET CATEGORY ENTITY
 * 
 * Tracks budget allocation and spending per expense category.
 * Per-trip configuration (each trip has its own budget breakdown).
 * 
 * Why this exists:
 * - Enables budget planning before trip
 * - Tracks spending against budget per category
 * - Alerts users when over budget
 * - Helps identify spending patterns
 * 
 * Design decisions:
 * - allocated is user-defined (can be 0, no limit)
 * - spent is computed in real-time (sum of expenses in category)
 * - Both values in trip.baseCurrency
 * - Default allocation uses percentages of trip.budget
 * 
 * Computed by: budget.service.ts: getBudgetBreakdown()
 * 
 * Relationships:
 * - Belongs to Trip (implicitly, stored in Map<tripId, BudgetCategory[]>)
 * - Links to ExpenseCategory (by category field)
 * 
 * Future enhancements:
 * - Add per-day budget (allocated / trip duration)
 * - Add budget alerts (notify at 80%, 100%, 120%)
 * - Add budget forecasting (projected overspend)
 * - Add budget recommendations (based on past trips)
 * - Add budget adjustments mid-trip
 */
export interface BudgetCategory {
  category: ExpenseCategory;    // Which category this budget is for
  allocated: number;            // Planned budget in trip baseCurrency
  spent: number;                // Actual spending in trip baseCurrency (computed)
}

/**
 * LOYALTY INFO ENTITY
 * 
 * Tracks user engagement and rewards across all trips.
 * Gamification element to encourage platform usage.
 * 
 * Why this exists:
 * - Rewards active users with loyalty tiers
 * - Encourages trip participation and expense tracking
 * - Foundation for future premium features/discounts
 * 
 * Point system:
 * - 100 points per trip participation
 * - 10 points per expense created
 * - 50 bonus points per completed trip
 * 
 * Tier thresholds:
 * - Bronze: 0-2499 points
 * - Silver: 2500-4999 points
 * - Gold: 5000+ points
 * 
 * Computed by: loyalty.service.ts: calculateLoyalty()
 * 
 * Design decisions:
 * - Points never decrease (no penalty system)
 * - Tiers are for display only (no feature gating yet)
 * - nextTierPoints shows progress to next tier (0 if at max tier)
 * - Global per user (not per trip)
 * 
 * Future enhancements:
 * - Add loyalty perks (discounts, premium features)
 * - Add point expiration (encourage ongoing usage)
 * - Add leaderboards (top users per month)
 * - Add referral bonuses (invite friends)
 * - Add behavioral scoring (settlement speed, expense accuracy)
 * - Add partnerships with vendors (earn points for bookings)
 */
export interface LoyaltyInfo {
  score: number;                // Total points accumulated
  tier: LoyaltyTier;            // Current tier based on score
  nextTierPoints: number;       // Points needed for next tier (0 if max tier)
}

/**
 * LOYALTY TIER ENUM
 * 
 * Defines user status levels based on engagement.
 * 
 * Tiers:
 * - bronze: Entry level (0+ points)
 * - silver: Mid level (2500+ points)
 * - gold: Top level (5000+ points)
 * 
 * Why these tiers:
 * - Bronze: Achievable immediately (onboarding)
 * - Silver: ~25 trips or 250 expenses (engaged user)
 * - Gold: ~50 trips or 500 expenses (power user)
 * 
 * Future: Add platinum tier at 10000 points
 */
export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

/**
 * SUPPORT TICKET ENTITY
 * 
 * Tracks user support requests and help inquiries.
 * Simple ticketing system for user assistance.
 * 
 * Why this exists:
 * - Provides help channel for users
 * - Tracks issue resolution
 * - Identifies common problems
 * - Foundation for premium support tier
 * 
 * Lifecycle:
 * 1. User creates ticket (status: open)
 * 2. Agent picks up ticket (status: in-progress)
 * 3. Issue resolved (status: resolved)
 * 
 * Design decisions:
 * - No user reference (no auth yet, anonymous tickets)
 * - No priority field (all tickets equal priority)
 * - No assignment (no agent management)
 * - description is optional (title might be enough)
 * - Timestamps in ISO 8601 format
 * 
 * Future enhancements:
 * - Add userId foreign key (link to user)
 * - Add priority (low, medium, high, urgent)
 * - Add assignment (assignedToUserId)
 * - Add comments/messages (conversation thread)
 * - Add attachments (screenshots, logs)
 * - Add SLA tracking (response time, resolution time)
 * - Add satisfaction rating (user feedback)
 * - Add escalation rules (auto-escalate if no response)
 */
export interface SupportTicket {
  id: string;                   // Unique identifier
  subject: string;              // Brief description of issue
  status: TicketStatus;         // Current ticket state
  createdAt: string;            // ISO 8601 timestamp when ticket created
  lastUpdated: string;          // ISO 8601 timestamp when ticket last modified
  description?: string;         // Detailed explanation of issue
}

/**
 * TICKET STATUS ENUM
 * 
 * Defines support ticket lifecycle states.
 * 
 * States:
 * - open: New ticket awaiting agent response
 * - in-progress: Agent actively working on ticket
 * - resolved: Issue fixed, ticket closed
 * 
 * Transitions:
 * - open → in-progress (agent starts work)
 * - in-progress → resolved (issue fixed)
 * - resolved → open (user reopens if issue persists)
 * 
 * Future: Add 'waiting-on-user', 'escalated', 'closed' states
 */
export type TicketStatus = 'open' | 'in-progress' | 'resolved';

/**
 * CHAT MESSAGE ENTITY
 * 
 * Represents a message in the AI assistant chat.
 * Used for expense analysis, budget tips, settlement advice.
 * 
 * Why this exists:
 * - Enables conversational interface for intelligence features
 * - Maintains chat history for context
 * - Provides audit trail of AI interactions
 * 
 * Design decisions:
 * - role distinguishes user messages from AI responses
 * - content is plain text (no markdown yet)
 * - timestamp for chronological ordering
 * - No userId (chat is anonymous/per-session currently)
 * - No tripId link (global chat, not trip-specific)
 * 
 * Future enhancements:
 * - Add userId for personalized responses
 * - Add tripId for trip-specific intelligence
 * - Add markdown support for formatted responses
 * - Add message reactions (helpful, not helpful)
 * - Add message attachments (expense details, charts)
 * - Add streaming support (real-time AI responses)
 */
export interface ChatMessage {
  id: string;                   // Unique identifier
  role: 'user' | 'assistant';   // Message sender type
  content: string;              // Message text content
  timestamp: string;            // ISO 8601 timestamp when message sent
}

// ===============================================
// DATA TRANSFER OBJECTS (DTOs)
// ===============================================
// Used for API request/response validation.
// Separate from domain entities to:
// - Control what fields clients can modify
// - Add validation rules specific to operations
// - Avoid exposing computed fields in requests

/**
 * CREATE TRIP DTO
 * 
 * Request body for POST /api/v1/trips
 * 
 * Differences from Trip entity:
 * - Uses participantIds (string[]) instead of participants (User[])
 * - No id (generated by server)
 * - No totalSpent (computed from expenses)
 * - No status (defaults to 'planning')
 * 
 * Validation (Zod schema in trip.routes.ts):
 * - name: min 1 char, max 100 chars
 * - startDate: valid ISO 8601, not in past
 * - endDate: valid ISO 8601, >= startDate
 * - baseCurrency: 3-char string (USD, EUR, etc.)
 * - budget: positive number
 * - participantIds: array with at least 1 ID
 */
export interface CreateTripDto {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  budget: number;
  participantIds: string[];
}

/**
 * UPDATE TRIP DTO
 * 
 * Request body for PUT /api/v1/trips/:id
 * 
 * All fields optional (partial update).
 * Cannot update:
 * - id (immutable)
 * - baseCurrency (would break balance calculations)
 * - totalSpent (computed field)
 * - participants (use separate endpoint in future)
 */
export interface UpdateTripDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: TripStatus;
}

/**
 * CREATE EXPENSE DTO
 * 
 * Request body for POST /api/v1/trips/:tripId/expenses
 * 
 * Differences from Expense entity:
 * - Uses paidById (string) instead of paidBy (User)
 * - No id (generated by server)
 * - No tripId in body (from URL parameter)
 * 
 * Validation:
 * - title: min 1 char
 * - amount: positive number
 * - currency: 3-char string
 * - category: valid ExpenseCategory
 * - paidById: must be trip participant
 * - splits: must match splitType logic
 * - date: valid ISO 8601
 */
export interface CreateExpenseDto {
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidById: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  date: string;
  notes?: string;
}

/**
 * UPDATE EXPENSE DTO
 * 
 * Request body for PUT /api/v1/trips/:tripId/expenses/:id
 * 
 * All fields optional (partial update).
 * Cannot update:
 * - id (immutable)
 * - tripId (immutable)
 * - amount (would require recalculating splits)
 * - currency (would require recalculating splits)
 * - paidById (would require recalculating balances)
 * - splitType (would require recalculating splits)
 * - splits (would require recalculating splits)
 * - date (immutable for audit trail)
 * 
 * Future: Allow full expense editing with recalculation
 */
export interface UpdateExpenseDto {
  title?: string;
  amount?: number;
  category?: ExpenseCategory;
  notes?: string;
}

/**
 * CREATE SUPPORT TICKET DTO
 * 
 * Request body for POST /api/v1/support/tickets
 * 
 * Differences from SupportTicket entity:
 * - No id (generated by server)
 * - No status (defaults to 'open')
 * - No timestamps (generated by server)
 * - description is required (not optional)
 */
export interface CreateSupportTicketDto {
  subject: string;
  description: string;
}

/**
 * UPDATE SUPPORT TICKET DTO
 * 
 * Request body for PUT /api/v1/support/tickets/:id
 * 
 * Only status can be updated.
 * Future: Allow updating description, adding comments
 */
export interface UpdateSupportTicketDto {
  status?: TicketStatus;
}

/**
 * CHAT MESSAGE DTO
 * 
 * Request body for POST /api/v1/intelligence/chat
 * 
 * Differences from ChatMessage entity:
 * - No id (generated by server)
 * - No role (always 'user' for requests)
 * - No timestamp (generated by server)
 * - tripId is optional (for trip-specific intelligence)
 * 
 * Response contains full ChatMessage with role='assistant'
 */
export interface ChatMessageDto {
  content: string;
  tripId?: string;  // Optional trip context for AI
}

/**
 * UPDATE BUDGET DTO
 * 
 * Request body for PUT /api/v1/trips/:tripId/budget
 * 
 * Allows bulk update of all category allocations.
 * 
 * Validation:
 * - categories: array with all 6 categories
 * - allocated: positive number or zero
 * - spent: ignored (computed field)
 */
export interface UpdateBudgetDto {
  categories: BudgetCategory[];
}
