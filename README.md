# 🌍 Trip Companion

**Smart Travel Expense & Planning Platform**

Trip Companion is a comprehensive travel management application that helps groups manage shared expenses, budgets, and settlements with AI-powered insights. Perfect for group trips, vacations, or any shared travel experience.

---

## ✨ Features

### 💰 **Expense Management**
- Track expenses with multiple split types (equal, unequal, percentage)
- Multi-currency support with automatic conversion
- Attach receipts and categorize expenses
- Real-time balance calculation

### 📊 **Budget Planning**
- Set per-category budgets for trips
- Track spending against budget in real-time
- Visual budget alerts and warnings
- Spending analytics and insights

### 🤝 **Settlement Tracking**
- Automatic settlement calculation using smart algorithms
- Minimize transaction count with optimized settlements
- Track payment status and history
- Send reminders for pending settlements

### 🏆 **Loyalty Program**
- Earn points for trip participation and expense tracking
- Three-tier system (Bronze, Silver, Gold)
- Unlock benefits and rewards
- Gamified travel experience

### 🤖 **AI Chat Assist**
- Get instant answers about trip expenses
- Smart budget recommendations
- Spending pattern analysis
- Natural language queries

### 🗺️ **Travel Intelligence**
- **Place Insights**: Detailed destination information (best time to visit, budget estimates, attractions, safety tips, visa requirements)
- **Vendor Directory**: Curated list of hotels, restaurants, tour operators with ratings and contact info
- **Human Agent Escalation**: Connect with travel experts for complex queries

### 📱 **Real-time Collaboration**
- Multi-user trip participation
- Live expense updates
- Shared trip dashboard
- Activity timeline

---

## 🏗️ Architecture

### **Backend** (`trip-companion-backend/`)
- **Framework**: Express.js with TypeScript
- **Architecture**: Modular service-based design
- **Data Storage**: In-memory mock data store (ready for database integration)
- **API**: RESTful API with comprehensive error handling
- **Security**: Helmet, CORS, input validation with Zod

**Modules:**
- `trip`: Trip CRUD operations
- `expense`: Expense tracking and split calculations
- `budget`: Budget management and tracking
- `settlement`: Smart settlement calculations
- `loyalty`: Points and tier management
- `intelligence`: AI chat assistant with ML features
- `vendor`: Vendor directory management
- `support`: Support ticket and human escalation

### **Frontend** (`trip-companion-ui/`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React hooks
- **API Client**: Centralized fetch wrapper with type-safe responses

**Pages:**
- Dashboard: Trip overview and statistics
- Trip Details & Overview
- Expenses: Track and manage expenses
- Budget: Plan and monitor budgets
- Balances: View who owes whom
- Loyalty: Points and rewards
- AI Assist: Chat interface for queries
- Place Insights: Destination information
- Vendors: Directory of travel vendors
- Support: Help center with human escalation

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn** or **bun**
- **Git**

### Installation

#### **1. Clone the Repository**
```bash
git clone https://github.com/ShUbhaM121208/trip-backend.git
git clone https://github.com/ShUbhaM121208/trip-companion-ui.git
```

#### **2. Backend Setup**
```bash
cd trip-companion-backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your configuration
# PORT=3000
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:8080

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

**Backend runs on**: `http://localhost:3000`

#### **3. Frontend Setup**
```bash
cd trip-companion-ui

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with backend URL
# VITE_API_URL=http://localhost:3000/api/v1

# Run development server
npm run dev

# Build for production
npm run build
npm run preview
```

**Frontend runs on**: `http://localhost:8080`

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Key Endpoints

#### **Trips**
- `GET /trips` - Get all trips
- `POST /trips` - Create a new trip
- `GET /trips/:id` - Get trip by ID
- `PUT /trips/:id` - Update trip
- `DELETE /trips/:id` - Delete trip

#### **Expenses**
- `GET /trips/:tripId/expenses` - Get trip expenses
- `POST /trips/:tripId/expenses` - Add expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

#### **Budget**
- `GET /trips/:tripId/budget` - Get trip budget
- `PUT /trips/:tripId/budget` - Update budget categories

#### **Settlements**
- `GET /trips/:tripId/balances` - Get user balances
- `POST /trips/:tripId/settlements` - Generate settlements
- `PUT /settlements/:id/paid` - Mark settlement as paid

#### **Loyalty**
- `GET /loyalty/user/:userId` - Get loyalty info
- `GET /loyalty/tiers` - Get tier information

#### **Intelligence (AI)**
- `POST /intelligence/chat` - Send chat message
- `GET /intelligence/place-insights/:destination` - Get place info
- `GET /intelligence/destinations` - List available destinations

#### **Vendors**
- `GET /vendors` - List vendors (filter by location/category)
- `GET /vendors/:id` - Get vendor details
- `GET /vendors/stats` - Get vendor statistics

#### **Support**
- `POST /support/tickets` - Create support ticket
- `GET /support/tickets` - List tickets
- `PUT /support/tickets/:id` - Update ticket status

---

## 🛠️ Tech Stack

### **Backend**
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| TypeScript | Type-safe development |
| Zod | Schema validation |
| Helmet | Security headers |
| Morgan | HTTP logging |
| CORS | Cross-origin requests |

### **Frontend**
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| TypeScript | Type-safe development |
| Vite | Build tool & dev server |
| React Router | Client-side routing |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library |
| Radix UI | Accessible primitives |
| Lucide React | Icon library |

---

## 📦 Deployment

### **Vercel Deployment** (Recommended)

Both frontend and backend are configured for Vercel deployment.

#### **Backend Deployment**
```bash
cd trip-companion-backend
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
- `CORS_ORIGIN`: Your frontend URL (e.g., `https://trip-companion-ui.vercel.app`)

#### **Frontend Deployment**
```bash
cd trip-companion-ui
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
- `VITE_API_URL`: Your backend URL (e.g., `https://trip-backend.vercel.app/api/v1`)

#### **Automatic Deployments**
Both repositories are configured for automatic deployments:
- Every push to `main` triggers a production deployment
- Pull requests create preview deployments

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions**

---

## 🧪 Testing

### Backend Tests
```bash
cd trip-companion-backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Frontend Tests
```bash
cd trip-companion-ui
npm test              # Run all tests
npm run test:watch    # Watch mode
```

---

## 📂 Project Structure

```
trip-companion/
├── trip-companion-backend/          # Express.js API
│   ├── src/
│   │   ├── modules/                 # Feature modules
│   │   │   ├── trip/
│   │   │   ├── expense/
│   │   │   ├── budget/
│   │   │   ├── settlement/
│   │   │   ├── loyalty/
│   │   │   ├── intelligence/
│   │   │   ├── vendor/
│   │   │   └── support/
│   │   ├── shared/                  # Shared utilities
│   │   │   ├── data/                # Mock data store
│   │   │   ├── middleware/          # Express middleware
│   │   │   ├── types/               # TypeScript interfaces
│   │   │   └── utils/               # Helper functions
│   │   ├── app.ts                   # Express app setup
│   │   └── server.ts                # Server entry point
│   ├── api/                         # Vercel serverless function
│   ├── docs/                        # Documentation
│   └── test-data/                   # Sample data for testing
│
└── trip-companion-ui/               # React Frontend
    ├── src/
    │   ├── pages/                   # Page components
    │   ├── components/              # Reusable components
    │   │   ├── ui/                  # shadcn/ui components
    │   │   └── layout/              # Layout components
    │   ├── lib/                     # Libraries & utilities
    │   │   ├── api.ts               # API client
    │   │   └── utils.ts             # Helper functions
    │   ├── types/                   # TypeScript interfaces
    │   ├── hooks/                   # Custom React hooks
    │   └── data/                    # Mock data
    └── public/                      # Static assets
```

---

## 🎯 Key Features in Detail

### **Smart Split Calculations**
- **Equal Split**: Divide amount equally among participants
- **Unequal Split**: Custom amounts per person
- **Percentage Split**: Define percentage per person
- Rounding adjustment to ensure total matches exactly

### **Multi-Currency Support**
- Track expenses in different currencies
- Automatic conversion to trip base currency
- Support for 150+ world currencies
- Real-time exchange rate integration (ready)

### **Optimized Settlements**
- Minimize number of transactions
- Graph-based settlement algorithm
- Smart debt simplification
- Clear payment instructions

### **ML-Powered Insights**
- 60+ features for model training
- Spending pattern analysis
- Budget optimization recommendations
- Historical trip comparisons
- Anomaly detection

---

## 🔐 Security Features

- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ Error handling without sensitive data exposure
- ✅ Environment variable management
- ✅ Type-safe API contracts

---

## 📝 Documentation

- **Backend API**: See `trip-companion-backend/README.md`
- **Frontend**: See `trip-companion-ui/README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **ML Features**: See `trip-companion-backend/docs/ML_FEATURES.md`
- **Feedback Loops**: See `trip-companion-backend/docs/FEEDBACK_LOOPS.md`
- **Edge Cases**: See `trip-companion-backend/docs/EDGE_CASES.md`

---

## 🗺️ Roadmap

### **Phase 1: Core Features** ✅
- [x] Trip management
- [x] Expense tracking with splits
- [x] Budget management
- [x] Settlement calculation
- [x] Basic UI/UX

### **Phase 2: Intelligence Layer** ✅
- [x] AI Chat Assistant
- [x] Place Insights
- [x] Vendor Directory
- [x] Loyalty Program
- [x] Support System

### **Phase 3: Database Integration** (In Progress)
- [ ] PostgreSQL with Prisma ORM
- [ ] Database migrations
- [ ] Data persistence
- [ ] User authentication

### **Phase 4: Advanced Features** (Planned)
- [ ] Real-time collaboration with WebSockets
- [ ] Mobile apps (React Native)
- [ ] Receipt OCR
- [ ] Automated expense imports
- [ ] ML model deployment
- [ ] Push notifications
- [ ] Social features

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Authors

**Shubham Singh**
- GitHub: [@ShUbhaM121208](https://github.com/ShUbhaM121208)

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful and accessible component library
- **Radix UI** - Unstyled, accessible UI primitives
- **Vercel** - Seamless deployment platform
- **Express.js** - Fast and minimalist web framework
- **React** - Powerful UI library

---

## 📞 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

## 🌟 Show Your Support

If you find this project helpful, please give it a ⭐️ on GitHub!

---

**Built with ❤️ for travelers around the world** 🌍✈️
