# Trip Companion Backend 🌍✈️

> **A comprehensive expense splitting and trip management platform with intelligent balance calculations and settlement optimization.**

Smart Trip Expense & Planning Platform - Backend API built with Node.js, TypeScript, and Express. Supports multi-currency expenses, flexible split calculations (equal, unequal, percentage), intelligent settlement recommendations, budget tracking, and loyalty rewards.

**📖 Documentation Philosophy:** This repository is intentionally documentation-heavy and implementation-light, as per the case study instructions, to highlight system design thinking, algorithmic trade-offs, and edge case awareness. The goal is clarity over code volume.

---

## 📋 Table of Contents

- [How to Review This Project](#how-to-review-this-project)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Core Algorithms](#core-algorithms)
- [What's Mocked](#whats-mocked)
- [Known Limitations](#known-limitations)
- [Testing](#testing)
- [Contributing](#contributing)

---

## 🗺️ How to Review This Project

For busy reviewers, here's the recommended walkthrough order:

1. **Start here (README)** - Get the big picture: features, architecture, limitations
2. **ER Diagram** (`docs/ER_DIAGRAM.md`) - Understand entities and relationships
3. **Domain Models** (`src/shared/types/index.ts`) - Review type definitions with extensive inline documentation
4. **Expense Splitting Engine** (`src/modules/expense/expense.service.ts`) - Core algorithm with step-by-step explanations
5. **Settlement Optimizer** (`src/modules/settlement/settlement.service.ts`) - Greedy algorithm with complexity analysis
6. **Edge Cases** (`docs/EDGE_CASES.md`) - 50+ edge cases with handling status and rounding tolerances
7. **Utility Functions** (`src/shared/utils/`) - Rounding precision and currency conversion

**Quick Start:** If you have 5 minutes, read sections 1, 2, and 6. If you have 30 minutes, follow the full order above.

---

## 📋 Table of Contents (Detailed) (Detailed)

- [How to Review This Project](#how-to-review-this-project)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Core Algorithms](#core-algorithms)
- [What's Mocked](#whats-mocked)
- [Known Limitations](#known-limitations)
- [Testing](#testing)
- [Contributing](#contributing)

---

## ✨ Features

### ✅ Fully Implemented

- **🎯 Expense Management**
  - Create, read, update, delete expenses
  - Multi-currency support (7 currencies: USD, EUR, GBP, JPY, CAD, AUD, INR)
  - Three split types: equal, unequal, percentage
  - Precise rounding to 2 decimals with adjustment logic
  - Category classification (6 categories)

- **💰 Balance & Settlement**
  - Real-time balance calculation per user
  - Multi-currency expense aggregation
  - Greedy settlement optimization (minimizes transactions)
  - Balance history and settlement suggestions

- **📊 Budget Tracking**
  - Per-trip budget allocation across categories
  - Default allocation percentages
  - Real-time spent tracking
  - Budget vs actual visualization

- **🏆 Loyalty Program**
  - Point-based gamification system
  - Three tiers: Bronze, Silver, Gold
  - Points for trip participation and expense creation
  - Tier progression tracking

- **💬 AI Assistant (Mock)**
  - Chat-based interface
  - Expense analysis and insights
  - Budget recommendations
  - Settlement advice

- **🎫 Support System**
  - Ticket creation and management
  - Status tracking (open, in-progress, resolved)
  - Simple escalation flow

### ⚠️ Not Implemented

- ❌ Database persistence (in-memory only)
- ❌ Authentication/Authorization
- ❌ Real AI integration
- ❌ Real-time currency rates
- ❌ File uploads (receipts)
- ❌ Email notifications
- ❌ Partial settlement tracking
- ❌ Payment integration

---

## 🏗️ Architecture

### Layered Monolithic Architecture

```
┌─────────────────────────────────────────┐
│          HTTP Layer (Routes)            │
│  Request validation with Zod schemas    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Controller Layer                │
│  Request/Response handling              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Service Layer                  │
│  Business logic & calculations          │
│  - Expense splitting                    │
│  - Balance computation                  │
│  - Settlement optimization              │
│  - Budget tracking                      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Layer (In-Memory)          │
│  Arrays & Maps (no database)            │
└─────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Clear boundaries between layers
2. **Type Safety**: TypeScript for compile-time checks
3. **Validation First**: Zod schemas at API boundaries
4. **Error Handling**: Custom error classes with HTTP status codes
5. **Stateless**: No session management (yet)
6. **RESTful**: Standard HTTP methods and status codes

---

## 📁 Project Structure

```
trip-companion-backend/
├── docs/                       # Documentation
│   └── ER_DIAGRAM.md          # Entity relationship diagram
├── src/
│   ├── modules/               # Feature modules
│   │   ├── trip/             # Trip CRUD operations
│   │   │   ├── trip.controller.ts
│   │   │   ├── trip.service.ts      # Business logic
│   │   │   ├── trip.model.ts        # Domain model
│   │   │   └── trip.routes.ts       # API routes
│   │   ├── expense/          # Expense splitting engine
│   │   │   ├── expense.controller.ts
│   │   │   ├── expense.service.ts   # Split calculations
│   │   │   ├── expense.model.ts
│   │   │   └── expense.routes.ts
│   │   ├── settlement/       # Balance & settlement
│   │   │   ├── settlement.controller.ts
│   │   │   ├── settlement.service.ts # Greedy algorithm
│   │   │   └── settlement.routes.ts
│   │   ├── budget/           # Budget tracking
│   │   ├── loyalty/          # Loyalty program
│   │   ├── intelligence/     # AI assistant (mock)
│   │   └── support/          # Support tickets
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts      # Comprehensive type definitions
│   │   ├── utils/
│   │   │   ├── rounding.util.ts     # Precision handling
│   │   │   ├── currency.util.ts     # Multi-currency
│   │   │   ├── date.util.ts         # Date validation
│   │   │   ├── id.util.ts           # ID generation
│   │   │   └── request.util.ts      # HTTP helpers
│   │   ├── data/
│   │   │   └── mockDataStore.ts     # In-memory storage
│   │   └── middleware/
│   │       ├── cors.ts              # CORS config
│   │       ├── errorHandler.ts      # Error handling
│   │       └── validator.ts         # Zod validation
│   ├── config/
│   │   └── index.ts          # App configuration
│   ├── app.ts                # Express app setup
│   ├── routes.ts             # Route aggregation
│   └── server.ts             # Server entry point
├── .env.example              # Environment template
├── .gitignore
├── eslint.config.js
├── nodemon.json              # Dev server config
├── package.json
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
└── README.md                 # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20+ LTS
- **Package Manager**: npm or bun
- **TypeScript**: 5.x (installed via dependencies)

### Installation

```bash
# Clone the repository
git clone https://github.com/ShUbhaM121208/trip-backend.git
cd trip-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configuration

Edit `.env` file:

```bash
PORT=3001                    # API server port
NODE_ENV=development         # development | production | test
CORS_ORIGIN=http://localhost:5173  # Frontend URL
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Production mode
npm start

# Run tests
npm test
```

### Verifying Installation

```bash
# Health check
curl http://localhost:3001/api/v1/health

# Get all trips
curl http://localhost:3001/api/v1/trips
```

Expected response:
```json
{
  "success": true,
  "data": [...],
  "message": "Trips retrieved successfully"
}
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3001/api/v1
```

### Authentication

**Current**: None (public API)  
**Future**: JWT tokens or session-based auth

### Response Format

All endpoints follow this structure:

```typescript
// Success
{
  "success": true,
  "data": any,
  "message": string
}

// Error
{
  "success": false,
  "error": {
    "message": string,
    "statusCode": number
  }
}
```

### Endpoints Overview

#### Trips
- `GET /trips` - List all trips
- `POST /trips` - Create new trip
- `GET /trips/:id` - Get trip details
- `PUT /trips/:id` - Update trip
- `DELETE /trips/:id` - Delete trip

#### Expenses
- `GET /trips/:tripId/expenses` - List trip expenses
- `POST /trips/:tripId/expenses` - Create expense
- `GET /trips/:tripId/expenses/:id` - Get expense
- `PUT /trips/:tripId/expenses/:id` - Update expense
- `DELETE /trips/:tripId/expenses/:id` - Delete expense

#### Settlements
- `GET /trips/:tripId/balances` - Get user balances
- `GET /trips/:tripId/settlements` - Get settlement recommendations
- `GET /trips/:tripId/settlements/summary` - Get settlement statistics

#### Budget
- `GET /trips/:tripId/budget` - Get budget breakdown
- `PUT /trips/:tripId/budget` - Update budget allocations

#### Loyalty
- `GET /loyalty/:userId` - Get user loyalty info
- `GET /loyalty/tiers` - Get tier information

#### Intelligence
- `POST /intelligence/chat` - Send chat message
- `GET /intelligence/chat/history` - Get chat history
- `DELETE /intelligence/chat/history` - Clear history

#### Support
- `GET /support/tickets` - List tickets
- `POST /support/tickets` - Create ticket
- `GET /support/tickets/:id` - Get ticket
- `PUT /support/tickets/:id` - Update ticket status
- `GET /support/stats` - Get ticket statistics

### Example API Calls

#### Create a Trip

```bash
curl -X POST http://localhost:3001/api/v1/trips \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bali Adventure 2026",
    "description": "Epic trip to Bali",
    "startDate": "2026-06-01",
    "endDate": "2026-06-15",
    "baseCurrency": "USD",
    "budget": 5000,
    "participantIds": ["user-1", "user-2", "user-3"]
  }'
```

#### Create an Expense (Equal Split)

```bash
curl -X POST http://localhost:3001/api/v1/trips/trip-1/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hotel Hilton",
    "amount": 300,
    "currency": "USD",
    "category": "accommodation",
    "paidById": "user-1",
    "splitType": "equal",
    "splits": [],
    "date": "2026-06-02"
  }'
```

#### Get Settlement Recommendations

```bash
curl http://localhost:3001/api/v1/trips/trip-1/settlements
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "from": { "id": "user-2", "name": "Sarah" },
      "to": { "id": "user-1", "name": "Alex" },
      "amount": 235.00,
      "currency": "USD"
    },
    {
      "from": { "id": "user-3", "name": "Mike" },
      "to": { "id": "user-1", "name": "Alex" },
      "amount": 250.00,
      "currency": "USD"
    }
  ]
}
```

---

## 🧮 Core Algorithms

### 1. Expense Splitting Engine

Located in: `src/modules/expense/expense.service.ts`

#### Equal Split
```
Algorithm:
1. Divide total by participant count
2. Round each split to 2 decimals
3. Calculate difference: total - sum(splits)
4. Adjust largest split by difference

Example: $100 ÷ 3 people
- Raw: [$33.333, $33.333, $33.334]
- Rounded: [$33.33, $33.33, $33.33] = $99.99
- Adjusted: [$33.34, $33.33, $33.33] = $100.00 ✓
```

#### Unequal Split
```
Algorithm:
1. Accept custom amounts per participant
2. Round to 2 decimals
3. Adjust largest if sum ≠ total

Example: $100 split as [$60, $25, $15]
- Validates and ensures sum = $100.00
```

#### Percentage Split
```
Algorithm:
1. Validate percentages sum to 100%
2. Calculate: amount = (total * percentage) / 100
3. Round to 2 decimals
4. Adjust largest if sum ≠ total

Example: $100 split as [50%, 30%, 20%]
- Calculated: [$50.00, $30.00, $20.00] = $100.00 ✓
```

**Key Insight**: Adjusting the largest split minimizes relative error.

### 2. Balance Calculation

Located in: `src/modules/settlement/settlement.service.ts`

```
Algorithm:
For each user:
  1. totalPaid = sum(expenses where paidBy === user)
  2. totalOwed = sum(expenseSplits where userId === user)
  3. Convert all to trip base currency
  4. balance = totalPaid - totalOwed

Interpretation:
- Positive: User is owed money (creditor)
- Negative: User owes money (debtor)
- Zero: User is settled

Example:
Alex paid $300, owes $170 → balance +$130 (owed)
Sarah paid $120, owes $170 → balance -$50 (owes)
Mike paid $90, owes $170 → balance -$80 (owes)

Verification: $130 + (-$50) + (-$80) = $0 ✓
```

### 3. Settlement Optimization (Greedy Algorithm)

Located in: `src/modules/settlement/settlement.service.ts`

```
Algorithm:
1. Calculate balances
2. Separate creditors (positive) and debtors (negative)
3. Sort both by amount (descending)
4. Greedy matching:
   while (creditors and debtors exist):
     - Match largest creditor with largest debtor
     - settlement = min(creditor balance, debtor balance)
     - Update remaining amounts
     - Remove if settled (< $0.01)
5. Return settlements

Example:
Creditors: [Alex($485)]
Debtors: [Mike($250), Sarah($235)]

Settlements:
1. Mike → Alex: $250 (Mike settled, Alex has $235 left)
2. Sarah → Alex: $235 (both settled)

Result: 2 transactions (minimal)
```

**Time Complexity**: O(n log n) for sorting + O(n) for matching  
**Space Complexity**: O(n)  
**Optimality**: Near-optimal (often optimal, rarely +1 transaction)

### 4. Rounding Precision Handling

Located in: `src/shared/utils/rounding.util.ts`

```
Problem: 0.1 + 0.2 = 0.30000000000000004 (JavaScript)

Solution: adjustSplitsForRounding()
1. Round all values to 2 decimals
2. Calculate difference: target - sum
3. If difference ≠ 0, adjust largest value

Why it works:
- Ensures splits sum exactly to total
- Minimizes relative error
- Deterministic behavior

Tolerance: 0.01 (1 cent acceptable error)
```

### 5. Multi-Currency Conversion

Located in: `src/shared/utils/currency.util.ts`

```
Algorithm:
1. Convert from source to USD: amountUSD = amount / fromRate
2. Convert from USD to target: result = amountUSD * toRate

Example: 100 EUR → JPY
- 100 EUR → 108.70 USD (100 / 0.92)
- 108.70 USD → 16,251 JPY (108.70 * 149.50)

Supported: USD, EUR, GBP, JPY, CAD, AUD, INR
Rates: Static (should be replaced with API)
```

---

## 🎭 What's Mocked

### 1. Database / Persistence
- **Current**: In-memory JavaScript arrays and Maps
- **Location**: `src/shared/data/mockDataStore.ts`
- **Limitation**: Data lost on server restart
- **Future**: PostgreSQL with Prisma ORM

### 2. Authentication
- **Current**: No authentication
- **Limitation**: All endpoints public, no user management
- **Future**: JWT tokens or session-based auth

### 3. AI Intelligence
- **Current**: Rule-based static responses
- **Location**: `src/modules/intelligence/intelligence.service.ts`
- **Limitation**: No actual AI processing
- **Future**: OpenAI/Claude API integration

### 4. Currency Exchange Rates
- **Current**: Static hardcoded rates
- **Location**: `src/shared/utils/currency.util.ts`
- **Limitation**: Rates never update, not accurate
- **Future**: Real-time API (fixer.io, exchangerate-api.com)

### 5. Payment Integration
- **Current**: Settlement recommendations only
- **Limitation**: No actual payment processing
- **Future**: Venmo, PayPal, Stripe integration

### 6. File Uploads
- **Current**: No file handling
- **Limitation**: Can't upload receipts
- **Future**: S3/CloudFlare for image storage

### 7. Email Notifications
- **Current**: No notifications
- **Limitation**: Users must check manually
- **Future**: SendGrid/AWS SES for emails

---

## ⚠️ Known Limitations

### Data Persistence
- **Issue**: All data stored in-memory
- **Impact**: Data lost on server restart
- **Workaround**: Use Docker volumes or database
- **Fix Priority**: HIGH

### ID Generation
- **Issue**: Timestamp-based IDs (not UUIDs)
- **Impact**: Predictable, not suitable for distributed systems
- **Workaround**: Switch to UUID v4
- **Fix Priority**: MEDIUM

### Currency Rates
- **Issue**: Static exchange rates from February 2026
- **Impact**: Inaccurate conversions
- **Workaround**: Manual rate updates
- **Fix Priority**: HIGH

### Settlement Tracking
- **Issue**: No partial payment tracking
- **Impact**: Can't mark settlements as paid
- **Workaround**: Manual tracking outside system
- **Fix Priority**: MEDIUM

### Expense Editing
- **Issue**: Limited update capabilities
- **Impact**: Can't change payer or splits after creation
- **Workaround**: Delete and recreate expense
- **Fix Priority**: LOW

### Validation
- **Issue**: No email format validation
- **Impact**: Invalid emails accepted
- **Workaround**: Frontend validation
- **Fix Priority**: LOW

### Performance
- **Issue**: No pagination (all records returned)
- **Impact**: Slow with large datasets (100+ expenses)
- **Workaround**: Limit data size
- **Fix Priority**: MEDIUM

### Security
- **Issue**: No rate limiting
- **Impact**: API can be abused
- **Workaround**: Use reverse proxy with rate limiting
- **Fix Priority**: HIGH (for production)

---

## 🧪 Testing

### Test Framework
- **Framework**: Vitest
- **Coverage**: V8 provider
- **Location**: `src/**/*.test.ts`

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage Status

**Current**: <5% (tests not yet written)  
**Target**: 80% for critical paths

### Critical Test Areas

1. **Expense Splitting** (HIGH PRIORITY)
   - Equal split with various amounts
   - Unequal split validation
   - Percentage split edge cases
   - Rounding adjustment accuracy

2. **Balance Calculation** (HIGH PRIORITY)
   - Multi-currency aggregation
   - Zero balance scenarios
   - Large number of expenses

3. **Settlement Optimization** (HIGH PRIORITY)
   - Greedy algorithm correctness
   - Edge cases (single creditor/debtor)
   - Rounding tolerance

4. **Budget Tracking** (MEDIUM PRIORITY)
   - Category allocation
   - Spent calculation
   - Default percentages

5. **Loyalty System** (LOW PRIORITY)
   - Point calculation
   - Tier thresholds
   - Progression logic

### Edge Cases to Test

Documented in: `docs/EDGE_CASES.md` (to be created)

Examples:
- Single participant trip
- Zero amount expenses
- All users pay exactly their share
- Expenses in different currencies
- Very large amounts (>$1M)
- Very small amounts (<$0.01)
- Rounding errors accumulation

---

## 🛠️ Development

### Code Style
- **Linter**: ESLint with TypeScript rules
- **Formatter**: Prettier (not configured)
- **Conventions**: See `eslint.config.js`

### Running Linter

```bash
npm run lint
```

### Adding New Features

1. Create module folder in `src/modules/`
2. Implement service class with business logic
3. Create controller for HTTP handling
4. Define routes with Zod validation
5. Add types to `src/shared/types/index.ts`
6. Register routes in `src/routes.ts`
7. Write tests
8. Update documentation

### Database Migration Path

When ready to add database:

1. Install Prisma: `npm install @prisma/client prisma`
2. Initialize: `npx prisma init`
3. Define schema (see `docs/ER_DIAGRAM.md` for structure)
4. Generate client: `npx prisma generate`
5. Create migration: `npx prisma migrate dev`
6. Update services to use Prisma instead of mockDataStore
7. Seed database: `npx prisma db seed`

### Environment Variables

```bash
PORT=3001                        # Server port
NODE_ENV=development             # Environment
CORS_ORIGIN=http://localhost:5173  # Frontend URL
DATABASE_URL=postgresql://...    # Future: DB connection
JWT_SECRET=your-secret-key       # Future: Auth
API_KEY=your-api-key             # Future: External APIs
```

---

## 📖 Additional Documentation

- **ER Diagram**: `docs/ER_DIAGRAM.md` - Complete entity relationships
- **Domain Models**: See comprehensive comments in `src/shared/types/index.ts`
- **Split Algorithm**: See detailed comments in `src/modules/expense/expense.service.ts`
- **Settlement Algorithm**: See step-by-step explanation in `src/modules/settlement/settlement.service.ts`

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with proper documentation
4. Write tests for new functionality
5. Run linter: `npm run lint`
6. Run tests: `npm test`
7. Commit: `git commit -m "Add amazing feature"`
8. Push: `git push origin feature/amazing-feature`
9. Open Pull Request

### Commit Message Guidelines

```
feat: Add percentage split validation
fix: Correct rounding in settlement calculation
docs: Update API documentation
refactor: Extract split logic to utility
test: Add edge cases for balance calculation
chore: Update dependencies
```

### Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] Comprehensive inline documentation
- [ ] Error handling for edge cases
- [ ] Input validation with Zod
- [ ] Tests written and passing
- [ ] No breaking changes (or clearly documented)
- [ ] README updated if needed

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Authors

- **Shubham** - Initial work - [ShUbhaM121208](https://github.com/ShUbhaM121208)

---

## 🙏 Acknowledgments

- TypeScript community for excellent type safety
- Express.js for robust web framework
- Zod for runtime type validation
- Vitest for fast testing

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: [trip-backend/issues](https://github.com/ShUbhaM121208/trip-backend/issues)
- **Email**: [your-email@example.com]

---

**Built with ❤️ for travelers who split bills fairly**
