# Trip Companion Backend

A monolithic Node.js + TypeScript backend for the Smart Trip Expense & Planning Platform.

## Architecture

**Layered Architecture:**
- **Routes/Controllers**: HTTP request handling and response formatting
- **Services**: Business logic and data manipulation
- **Models**: Domain entities and data structures
- **Data Store**: In-memory data storage (no database)

## Project Structure

```
src/
├── modules/           # Feature modules
│   ├── trip/         # Trip management
│   ├── expense/      # Expense tracking
│   ├── settlement/   # Balance calculations and settlements
│   ├── budget/       # Budget tracking
│   ├── loyalty/      # Loyalty program
│   ├── intelligence/ # AI assistant
│   └── support/      # Customer support
├── shared/           # Shared utilities and data
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   ├── data/         # In-memory data store
│   └── middleware/   # Express middleware
├── config/           # Application configuration
├── app.ts            # Express app setup
└── server.ts         # Server entry point
```

## Getting Started

### Prerequisites
- Node.js v20+ LTS
- npm or bun

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

### Development

Run development server with hot reload:

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production

Run production server:

```bash
npm start
```

### Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Endpoints

#### Trips
- `GET /trips` - Get all trips
- `GET /trips/:id` - Get trip by ID
- `POST /trips` - Create new trip
- `PUT /trips/:id` - Update trip
- `DELETE /trips/:id` - Delete trip
- `GET /trips/:id/participants` - Get trip participants

#### Expenses
- `GET /trips/:tripId/expenses` - Get all expenses for trip
- `GET /expenses/:id` - Get expense by ID
- `POST /trips/:tripId/expenses` - Create expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

#### Settlements
- `GET /trips/:tripId/balances` - Get user balances
- `GET /trips/:tripId/settlements` - Get optimal settlements

#### Budget
- `GET /trips/:tripId/budget` - Get budget breakdown
- `PUT /trips/:tripId/budget` - Update budget allocations

#### Loyalty
- `GET /loyalty/:userId` - Get user loyalty info
- `GET /loyalty/tiers` - Get tier information

#### Intelligence
- `POST /intelligence/chat` - Send message to AI assistant

#### Support
- `GET /support/tickets` - Get all support tickets
- `GET /support/tickets/:id` - Get ticket by ID
- `POST /support/tickets` - Create support ticket
- `PUT /support/tickets/:id` - Update ticket

## Features

### Business Logic

- **Expense Splitting**: Equal, unequal, and percentage-based splits
- **Balance Calculation**: Track who owes whom
- **Settlement Optimization**: Minimize number of transactions using debt simplification
- **Budget Tracking**: Monitor spending by category
- **Currency Handling**: Multi-currency support with rounding utilities
- **Loyalty System**: Points and tier-based rewards

### No Authentication

This version has no authentication system. All endpoints are publicly accessible.

### In-Memory Storage

Data is stored in memory using JavaScript arrays. Data resets on server restart.

## License

ISC
