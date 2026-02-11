# Entity Relationship Diagram

## Overview

This document describes the domain model relationships for the Trip Companion platform. The model supports multi-user trip expense tracking with flexible splitting, balance calculation, and settlement recommendations.

## Core Entities (Persisted)

These entities represent data that is currently stored in-memory and will be persisted in a database.

### User
- **Primary Key**: `id` (string)
- **Attributes**: `name`, `email`, `avatarUrl`
- **Description**: Represents a person who can participate in trips

### Trip
- **Primary Key**: `id` (string)
- **Attributes**: `name`, `description`, `startDate`, `endDate`, `baseCurrency`, `budget`, `totalSpent`, `status`
- **Description**: Represents a shared trip where multiple users track expenses together

### Expense
- **Primary Key**: `id` (string)
- **Foreign Keys**: `tripId` → Trip, `paidBy.id` → User
- **Attributes**: `title`, `amount`, `currency`, `category`, `splitType`, `date`, `notes`
- **Description**: Represents a single payment made by one person that is split among participants

### ExpenseSplit (Embedded)
- **Composite Key**: `(expenseId, userId)`
- **Foreign Key**: `userId` → User
- **Attributes**: `amount`, `percentage`
- **Description**: Represents one person's share of an expense (embedded within Expense)

### SupportTicket
- **Primary Key**: `id` (string)
- **Attributes**: `subject`, `description`, `status`, `createdAt`, `lastUpdated`
- **Description**: Represents a user support request

### ChatMessage
- **Primary Key**: `id` (string)
- **Attributes**: `role`, `content`, `timestamp`
- **Description**: Represents a message in the AI assistant chat

## Derived Entities (Computed, Not Persisted)

These entities are calculated on-demand from core entities and are not stored in the database.

### Balance
- **Computed From**: Trip expenses + splits
- **Attributes**: `userId`, `userName`, `amount`
- **Description**: Net balance per user (positive = owed, negative = owes)

### Settlement
- **Computed From**: Balance entities
- **Attributes**: `from`, `to`, `amount`, `currency`
- **Description**: Recommended payment to settle balances

### BudgetCategory
- **Computed From**: Trip budget + expenses by category
- **Attributes**: `category`, `allocated`, `spent`
- **Description**: Budget tracking per expense category

### LoyaltyInfo
- **Computed From**: User's trip participation + expense creation
- **Attributes**: `score`, `tier`, `nextTierPoints`
- **Description**: User engagement metrics and tier status

## Entity Relationship Diagram

```
┌─────────────┐
│    USER     │
│─────────────│
│ id (PK)     │
│ name        │
│ email       │
│ avatarUrl   │
└─────────────┘
       │
       │ participates in (M:N)
       │ [via Trip.participants array]
       │
       ▼
┌─────────────────────────────┐
│           TRIP              │
│─────────────────────────────│
│ id (PK)                     │
│ name                        │
│ description                 │
│ startDate                   │
│ endDate                     │
│ baseCurrency                │
│ budget                      │
│ totalSpent (computed)       │
│ status                      │
│ participants[] (User[])     │◀────┐
└─────────────────────────────┘     │
       │                             │
       │ has many (1:N)              │
       │                             │
       ▼                             │
┌─────────────────────────────┐     │
│         EXPENSE             │     │
│─────────────────────────────│     │
│ id (PK)                     │     │
│ tripId (FK) ────────────────┘     │
│ title                       │     │
│ amount                      │     │
│ currency                    │     │
│ category                    │     │
│ paidBy (User) ──────────────────┘
│ splitType                   │
│ date                        │
│ notes                       │
│ splits[] (ExpenseSplit[])   │◀────┐
└─────────────────────────────┘     │
       │                             │
       │ has many (1:N)              │
       │ [embedded]                  │
       ▼                             │
┌─────────────────────────────┐     │
│      EXPENSE SPLIT          │     │
│─────────────────────────────│     │
│ userId (FK) ─────────────────────┘
│ amount                      │
│ percentage                  │
└─────────────────────────────┘

DERIVED ENTITIES (Computed from above):

Trip.expenses ──────▶ BALANCE (per user)
                      │
                      └──▶ SETTLEMENT (recommended payments)

Trip.budget + 
Trip.expenses ──────▶ BUDGET CATEGORY (per category)

User.trips + 
User.expenses ──────▶ LOYALTY INFO (per user)


INDEPENDENT ENTITIES:

┌─────────────────────────────┐
│      SUPPORT TICKET         │
│─────────────────────────────│
│ id (PK)                     │
│ subject                     │
│ description                 │
│ status                      │
│ createdAt                   │
│ lastUpdated                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│       CHAT MESSAGE          │
│─────────────────────────────│
│ id (PK)                     │
│ role                        │
│ content                     │
│ timestamp                   │
└─────────────────────────────┘
```

## Cardinality Details

### User ↔ Trip (M:N via participants array)
- **Current Implementation**: Trip contains `participants: User[]` (denormalized)
- **Relationship**: One User can participate in many Trips; One Trip has many Users
- **Cardinality**: Many-to-Many (M:N)
- **Future Database Schema**: 
  ```sql
  CREATE TABLE trip_participants (
    trip_id VARCHAR PRIMARY KEY,
    user_id VARCHAR PRIMARY KEY,
    role VARCHAR DEFAULT 'participant', -- admin, participant
    joined_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  ```

### Trip → Expense (1:N)
- **Relationship**: One Trip has many Expenses; One Expense belongs to one Trip
- **Cardinality**: One-to-Many (1:N)
- **Foreign Key**: `Expense.tripId` → `Trip.id`
- **Cascade**: Deleting a Trip deletes all its Expenses

### User → Expense (1:N via paidBy)
- **Current Implementation**: Expense contains `paidBy: User` (denormalized)
- **Relationship**: One User can pay for many Expenses; One Expense is paid by one User
- **Cardinality**: One-to-Many (1:N)
- **Future Database Schema**: Store `paidById` and join on read

### Expense → ExpenseSplit (1:N, embedded)
- **Relationship**: One Expense has many ExpenseSplits; One ExpenseSplit belongs to one Expense
- **Cardinality**: One-to-Many (1:N)
- **Implementation**: Embedded array within Expense (no separate table)
- **Constraint**: Sum of split amounts must equal expense amount (within 0.01 tolerance)

### User ↔ ExpenseSplit (1:N)
- **Relationship**: One User can have many ExpenseSplits; One ExpenseSplit belongs to one User
- **Cardinality**: One-to-Many (1:N)
- **Foreign Key**: `ExpenseSplit.userId` → `User.id`

### Trip → Balance (1:N, derived)
- **Relationship**: One Trip produces N Balances (one per participant)
- **Cardinality**: One-to-Many (1:N)
- **Computed**: Not stored, calculated from Expenses and ExpenseSplits
- **Formula**: `balance = sum(expenses.paidBy === userId) - sum(expenseSplits.userId === userId)`

### Balance → Settlement (N:M, derived)
- **Relationship**: Multiple Balances generate multiple Settlements using greedy matching
- **Cardinality**: Many-to-Many (N:M)
- **Computed**: Not stored, calculated from Balances using settlement algorithm
- **Algorithm**: Match largest creditor with largest debtor iteratively

### Trip → BudgetCategory (1:N, derived)
- **Relationship**: One Trip has 6 BudgetCategories (one per ExpenseCategory)
- **Cardinality**: One-to-Many (1:6, fixed)
- **Computed**: Allocated values user-defined, spent values computed from Expenses

### User → LoyaltyInfo (1:1, derived)
- **Relationship**: One User has one LoyaltyInfo
- **Cardinality**: One-to-One (1:1)
- **Computed**: Calculated from user's trip participation and expense creation

## Data Flow Examples

### Creating an Expense
1. User creates Expense with `tripId`, `paidById`, `amount`, `splitType`, `splits[]`
2. System validates:
   - `tripId` exists
   - `paidById` is a trip participant
   - All `splits[].userId` are trip participants
   - Splits match split type logic (equal, unequal, percentage)
3. System calculates split amounts (if needed) and rounds to 2 decimals
4. System stores Expense with embedded ExpenseSplits
5. System updates `Trip.totalSpent` (computed field)

### Calculating Balances
1. User requests balances for Trip
2. System retrieves all Expenses for Trip
3. For each participant:
   - Calculate `totalPaid` = sum of all `expense.amount` where `expense.paidBy.id === userId` (converted to trip currency)
   - Calculate `totalOwed` = sum of all `split.amount` where `split.userId === userId` (converted to trip currency)
   - Calculate `balance = totalPaid - totalOwed`
4. Return array of Balance objects sorted by amount (creditors first)

### Suggesting Settlements
1. System calculates Balances (see above)
2. Separate Balances into:
   - `creditors`: balances > 0.01 (sorted descending)
   - `debtors`: balances < -0.01 (sorted by absolute value descending)
3. Greedy matching algorithm:
   ```
   while (creditors.length > 0 && debtors.length > 0):
     creditor = creditors[0]
     debtor = debtors[0]
     amount = min(creditor.balance, abs(debtor.balance))
     
     settlements.push({ from: debtor, to: creditor, amount })
     
     creditor.balance -= amount
     debtor.balance += amount
     
     if (creditor.balance < 0.01): remove creditor
     if (abs(debtor.balance) < 0.01): remove debtor
   ```
4. Return array of Settlement objects

### Computing Budget Breakdown
1. User requests budget breakdown for Trip
2. System retrieves or initializes BudgetCategory array (6 categories)
3. For each category:
   - `allocated` = user-defined or default percentage of trip.budget
   - `spent` = sum of all `expense.amount` where `expense.category === category` (converted to trip currency)
4. Return array of BudgetCategory objects

## Database Migration Strategy

### Current State
- In-memory storage using JavaScript arrays and Maps
- No persistence across server restarts
- No transactions or referential integrity

### Target State (PostgreSQL + Prisma)
```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  avatarUrl String?
  
  // Relations
  tripParticipations TripParticipant[]
  expensesPaid       Expense[]         @relation("PaidBy")
  expenseSplits      ExpenseSplit[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Trip {
  id           String   @id @default(uuid())
  name         String
  description  String?
  startDate    DateTime
  endDate      DateTime
  baseCurrency String   @db.VarChar(3)
  budget       Decimal  @db.Decimal(10, 2)
  status       String   @default("planning")
  
  // Relations
  participants TripParticipant[]
  expenses     Expense[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TripParticipant {
  tripId String
  userId String
  role   String @default("participant")
  
  trip User @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user Trip @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@id([tripId, userId])
  @@index([userId])
}

model Expense {
  id        String   @id @default(uuid())
  tripId    String
  title     String
  amount    Decimal  @db.Decimal(10, 2)
  currency  String   @db.VarChar(3)
  category  String
  paidById  String
  splitType String
  date      DateTime
  notes     String?
  
  // Relations
  trip   Trip           @relation(fields: [tripId], references: [id], onDelete: Cascade)
  paidBy User           @relation("PaidBy", fields: [paidById], references: [id])
  splits ExpenseSplit[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([tripId])
  @@index([paidById])
}

model ExpenseSplit {
  expenseId  String
  userId     String
  amount     Decimal @db.Decimal(10, 2)
  percentage Decimal? @db.Decimal(5, 2)
  
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])
  
  @@id([expenseId, userId])
  @@index([userId])
}

model SupportTicket {
  id          String   @id @default(uuid())
  subject     String
  description String?
  status      String   @default("open")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ChatMessage {
  id        String   @id @default(uuid())
  role      String
  content   String   @db.Text
  timestamp DateTime @default(now())
  
  @@index([timestamp])
}
```

### Migration Steps
1. Install Prisma: `npm install @prisma/client prisma`
2. Initialize Prisma: `npx prisma init`
3. Define schema (see above)
4. Generate client: `npx prisma generate`
5. Create migration: `npx prisma migrate dev --name init`
6. Update services to use Prisma client instead of in-memory arrays
7. Seed database with mock data: `npx prisma db seed`

### Service Layer Changes
- Replace `mockDataStore.ts` imports with Prisma client
- Update CRUD methods to use async/await with Prisma queries
- Add transaction support for multi-step operations
- Keep computed entities (Balance, Settlement, BudgetCategory, LoyaltyInfo) as service methods

## Constraints and Validation

### Database Constraints (Future)
- `User.email` UNIQUE
- `Trip.baseCurrency` VARCHAR(3) (ISO 4217)
- `Trip.budget` DECIMAL(10, 2) CHECK (> 0)
- `Trip.endDate` CHECK (>= startDate)
- `Expense.amount` DECIMAL(10, 2) CHECK (> 0)
- `ExpenseSplit.amount` DECIMAL(10, 2) CHECK (>= 0)
- `ExpenseSplit.percentage` DECIMAL(5, 2) CHECK (>= 0 AND <= 100)
- Foreign key constraints with CASCADE on delete

### Application-Level Validation
- Sum of ExpenseSplit amounts must equal Expense amount (within 0.01 tolerance)
- Sum of ExpenseSplit percentages must equal 100 for percentage split type
- All split userIds must be trip participants
- Expense paidBy must be a trip participant
- Trip must have at least 1 participant
- Expense date should be between trip startDate and endDate (warning, not error)

## Performance Considerations

### Indexes (Future Database)
- `trip_participants(userId)` - Fast lookup of user's trips
- `expenses(tripId)` - Fast retrieval of trip expenses
- `expenses(paidById)` - Fast lookup of user's paid expenses
- `expense_splits(userId)` - Fast lookup of user's expense splits
- `chat_messages(timestamp)` - Chronological ordering

### Computed Fields
- `Trip.totalSpent` - Computed by summing expenses, not stored
- Consider materialized view or cached value for large trips
- Invalidate cache on expense create/update/delete

### N+1 Query Prevention
- Use Prisma `include` to eager load relations:
  - Trip with participants
  - Expense with paidBy and splits
- Consider GraphQL DataLoader pattern for batch loading

## Future Enhancements

### Additional Relationships
1. **User → SupportTicket** (1:N)
   - Track which user created which ticket
   - Requires authentication

2. **Trip → ChatMessage** (1:N)
   - Trip-specific AI chat context
   - Enable trip-aware intelligence features

3. **TripParticipant.role** (admin, participant)
   - Different permissions per participant
   - Admin can modify trip, participants read-only

4. **Expense.attachments[]** (1:N)
   - Receipt images, PDFs
   - Store in S3/CloudFlare, reference URLs in database

5. **Settlement → Payment** (1:1)
   - Track actual payments made
   - Status: pending, completed, failed
   - Payment proof (transaction ID, screenshot)

### Soft Deletes
- Add `deletedAt` timestamp to all entities
- Filter out deleted records in queries
- Enable data recovery and audit trails

### Audit Logs
- Track all create/update/delete operations
- Store: userId, action, entityType, entityId, changes, timestamp
- Enable compliance and debugging

---

*Last Updated: February 6, 2026*
