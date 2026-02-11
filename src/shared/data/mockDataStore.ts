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
  Vendor,
  PlaceInsight,
  Settlement,
} from '../types';

/**
 * Mock Users Database
 */
export const users: User[] = [
  { id: 'u1', name: 'Alex Chen', email: 'alex@example.com', subscriptionTier: 'premium', subscriptionExpiry: '2026-12-31' },
  { id: 'u2', name: 'Sarah Kim', email: 'sarah@example.com', subscriptionTier: 'basic', subscriptionExpiry: '2026-06-30' },
  { id: 'u3', name: 'Mike Johnson', email: 'mike@example.com', subscriptionTier: 'free' },
  { id: 'u4', name: 'Emma Davis', email: 'emma@example.com', subscriptionTier: 'free' },
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

/**
 * Mock Vendors Database
 * Curated list of approved vendors across popular destinations
 */
export const vendors: Vendor[] = [
  // Paris Vendors
  {
    id: 'v1',
    name: 'Hotel Le Marais',
    category: 'hotel',
    location: 'Paris',
    contact: {
      phone: '+33 1 42 78 91 23',
      email: 'contact@hotelmarais.fr',
      website: 'https://hotelmarais.fr',
    },
    rating: 4.7,
    verified: true,
    services: ['Accommodation', 'Breakfast', 'WiFi', 'Airport Transfer'],
    priceRange: '$$',
    description: 'Boutique hotel in the heart of Le Marais district',
  },
  {
    id: 'v2',
    name: 'Le Comptoir du Relais',
    category: 'restaurant',
    location: 'Paris',
    contact: {
      phone: '+33 1 44 27 07 97',
      email: 'reservations@comptoirparis.fr',
      website: 'https://comptoirparis.fr',
    },
    rating: 4.8,
    verified: true,
    services: ['French Cuisine', 'Wine Tasting', 'Private Dining'],
    priceRange: '$$$',
    description: 'Authentic French bistro with seasonal menu',
  },
  {
    id: 'v3',
    name: 'Paris Walking Tours',
    category: 'tour',
    location: 'Paris',
    contact: {
      phone: '+33 6 12 34 56 78',
      email: 'info@pariswalkingtours.com',
      website: 'https://pariswalkingtours.com',
    },
    rating: 4.9,
    verified: true,
    services: ['City Tours', 'Museum Guides', 'Food Tours', 'Photography Tours'],
    priceRange: '$',
    description: 'Expert-led walking tours of Paris landmarks',
  },
  {
    id: 'v4',
    name: 'Paris Metro Pass Office',
    category: 'transport',
    location: 'Paris',
    contact: {
      phone: '+33 1 55 68 23 45',
      email: 'support@ratp.fr',
      website: 'https://ratp.fr',
    },
    rating: 4.2,
    verified: true,
    services: ['Metro Cards', 'Tourist Passes', 'Airport Shuttles'],
    priceRange: '$',
    description: 'Official Paris public transportation services',
  },
  {
    id: 'v5',
    name: 'SOS Médecins Paris',
    category: 'emergency',
    location: 'Paris',
    contact: {
      phone: '+33 1 47 07 77 77',
      email: 'urgence@sosmedecins-paris.fr',
      website: 'https://sosmedecins-paris.fr',
    },
    rating: 4.6,
    verified: true,
    services: ['24/7 Medical Care', 'Home Visits', 'Prescriptions', 'English Speaking'],
    priceRange: '$$',
    description: 'Emergency medical services available 24/7',
  },
  
  // Tokyo Vendors
  {
    id: 'v6',
    name: 'Shinjuku Grand Hotel',
    category: 'hotel',
    location: 'Tokyo',
    contact: {
      phone: '+81 3-1234-5678',
      email: 'reservations@shinjukugrand.jp',
      website: 'https://shinjukugrand.jp',
    },
    rating: 4.6,
    verified: true,
    services: ['Accommodation', 'Onsen', 'Restaurant', 'Concierge'],
    priceRange: '$$$',
    description: 'Luxury hotel near Shinjuku Station',
  },
  {
    id: 'v7',
    name: 'Tsukiji Sushi Bar',
    category: 'restaurant',
    location: 'Tokyo',
    contact: {
      phone: '+81 3-9876-5432',
      email: 'info@tsukijisushi.jp',
      website: 'https://tsukijisushi.jp',
    },
    rating: 4.9,
    verified: true,
    services: ['Sushi', 'Omakase', 'English Menu', 'Sake Pairing'],
    priceRange: '$$$',
    description: 'Michelin-recommended sushi experience',
  },
  {
    id: 'v8',
    name: 'Tokyo Food Tours',
    category: 'tour',
    location: 'Tokyo',
    contact: {
      phone: '+81 80-1234-5678',
      email: 'tours@tokyofood.com',
      website: 'https://tokyofoodtours.com',
    },
    rating: 4.8,
    verified: true,
    services: ['Food Tours', 'Cultural Experiences', 'Night Tours', 'Private Groups'],
    priceRange: '$$',
    description: 'Authentic Tokyo food and culture tours',
  },
  {
    id: 'v9',
    name: 'JR Pass Center Tokyo',
    category: 'transport',
    location: 'Tokyo',
    contact: {
      phone: '+81 3-3333-3333',
      email: 'info@jrpass.com',
      website: 'https://jrpass.com',
    },
    rating: 4.5,
    verified: true,
    services: ['JR Pass', 'Shinkansen Tickets', 'IC Cards', 'Route Planning'],
    priceRange: '$$',
    description: 'Official Japan Rail Pass office',
  },
  {
    id: 'v10',
    name: 'Tokyo Medical Clinic',
    category: 'emergency',
    location: 'Tokyo',
    contact: {
      phone: '+81 3-4444-5555',
      email: 'emergency@tokyomedical.jp',
      website: 'https://tokyomedical.jp',
    },
    rating: 4.7,
    verified: true,
    services: ['English Speaking Doctors', '24/7 Emergency', 'Insurance Accepted', 'Pharmacy'],
    priceRange: '$$',
    description: 'International medical clinic with multilingual staff',
  },

  // Bali Vendors
  {
    id: 'v11',
    name: 'Ubud Harmony Resort',
    category: 'hotel',
    location: 'Bali',
    contact: {
      phone: '+62 361-123456',
      email: 'stay@ubudharmony.com',
      website: 'https://ubudharmony.com',
    },
    rating: 4.8,
    verified: true,
    services: ['Villa Accommodation', 'Spa', 'Yoga Classes', 'Rice Field Views'],
    priceRange: '$$',
    description: 'Peaceful resort surrounded by rice terraces',
  },
  {
    id: 'v12',
    name: 'Warung Bali Authentic',
    category: 'restaurant',
    location: 'Bali',
    contact: {
      phone: '+62 361-987654',
      email: 'reservations@warungbali.com',
      website: 'https://warungbali.com',
    },
    rating: 4.6,
    verified: true,
    services: ['Indonesian Cuisine', 'Cooking Classes', 'Vegetarian Options', 'Ocean View'],
    priceRange: '$',
    description: 'Traditional Balinese restaurant with cooking classes',
  },
  {
    id: 'v13',
    name: 'Bali Adventure Tours',
    category: 'tour',
    location: 'Bali',
    contact: {
      phone: '+62 812-3456-7890',
      email: 'adventures@balitours.com',
      website: 'https://baliadventuretours.com',
    },
    rating: 4.9,
    verified: true,
    services: ['Temple Tours', 'Diving', 'Surfing Lessons', 'Volcano Hiking', 'Photography'],
    priceRange: '$$',
    description: 'Full-service adventure and cultural tours',
  },
  {
    id: 'v14',
    name: 'Bali Scooter Rentals',
    category: 'transport',
    location: 'Bali',
    contact: {
      phone: '+62 361-555666',
      email: 'rent@baliscooters.com',
      website: 'https://baliscooters.com',
    },
    rating: 4.4,
    verified: true,
    services: ['Scooter Rental', 'Car Rental', 'Driver Services', 'Airport Pickup'],
    priceRange: '$',
    description: 'Reliable vehicle rentals across Bali',
  },
  {
    id: 'v15',
    name: 'BIMC Hospital Bali',
    category: 'emergency',
    location: 'Bali',
    contact: {
      phone: '+62 361-761263',
      email: 'emergency@bimcbali.com',
      website: 'https://bimcbali.com',
    },
    rating: 4.8,
    verified: true,
    services: ['24/7 Emergency Room', 'International Doctors', 'Travel Insurance', 'Ambulance'],
    priceRange: '$$$',
    description: 'International hospital with 24/7 emergency services',
  },

  // New York Vendors
  {
    id: 'v16',
    name: 'Manhattan Suites Hotel',
    category: 'hotel',
    location: 'New York',
    contact: {
      phone: '+1 212-555-0100',
      email: 'reservations@manhattansuites.com',
      website: 'https://manhattansuites.com',
    },
    rating: 4.5,
    verified: true,
    services: ['Accommodation', 'Fitness Center', 'Business Center', 'Rooftop Bar'],
    priceRange: '$$$',
    description: 'Modern hotel in Midtown Manhattan',
  },
  {
    id: 'v17',
    name: 'Brooklyn Bites',
    category: 'restaurant',
    location: 'New York',
    contact: {
      phone: '+1 718-555-0200',
      email: 'reservations@brooklynbites.com',
      website: 'https://brooklynbites.com',
    },
    rating: 4.7,
    verified: true,
    services: ['American Cuisine', 'Craft Cocktails', 'Weekend Brunch', 'Private Events'],
    priceRange: '$$',
    description: 'Trendy Brooklyn restaurant with farm-to-table menu',
  },
  {
    id: 'v18',
    name: 'NYC Cultural Tours',
    category: 'tour',
    location: 'New York',
    contact: {
      phone: '+1 212-555-0300',
      email: 'info@nycculturaltours.com',
      website: 'https://nycculturaltours.com',
    },
    rating: 4.8,
    verified: true,
    services: ['City Tours', 'Museum Tickets', 'Broadway Shows', 'Photography Tours'],
    priceRange: '$$',
    description: 'Expert-guided tours of NYC landmarks and culture',
  },
  {
    id: 'v19',
    name: 'NYC Subway & Transit',
    category: 'transport',
    location: 'New York',
    contact: {
      phone: '+1 212-555-0400',
      email: 'support@mta.nyc',
      website: 'https://mta.info',
    },
    rating: 4.0,
    verified: true,
    services: ['MetroCard', 'Tourist Passes', 'Route Planning', 'Accessibility Services'],
    priceRange: '$',
    description: 'Official NYC public transportation services',
  },
  {
    id: 'v20',
    name: 'NYC Emergency Medical',
    category: 'emergency',
    location: 'New York',
    contact: {
      phone: '+1 212-555-0911',
      email: 'emergency@nycmedical.com',
      website: 'https://nycemergencymedical.com',
    },
    rating: 4.6,
    verified: true,
    services: ['24/7 Emergency Care', 'Urgent Care', 'Multilingual Staff', 'Insurance Billing'],
    priceRange: '$$$',
    description: 'Comprehensive emergency medical services in Manhattan',
  },

  // London Vendors
  {
    id: 'v21',
    name: 'The Westminster Hotel',
    category: 'hotel',
    location: 'London',
    contact: {
      phone: '+44 20 7123 4567',
      email: 'bookings@westminsterhotel.co.uk',
      website: 'https://westminsterhotel.co.uk',
    },
    rating: 4.7,
    verified: true,
    services: ['Luxury Accommodation', 'Afternoon Tea', 'Concierge', 'Thames View'],
    priceRange: '$$$',
    description: 'Historic hotel near Westminster Abbey',
  },
  {
    id: 'v22',
    name: 'Borough Market Kitchen',
    category: 'restaurant',
    location: 'London',
    contact: {
      phone: '+44 20 7234 5678',
      email: 'reservations@boroughkitchen.co.uk',
      website: 'https://boroughkitchen.co.uk',
    },
    rating: 4.6,
    verified: true,
    services: ['British Cuisine', 'Market Fresh Ingredients', 'Wine Bar', 'Chef\'s Table'],
    priceRange: '$$',
    description: 'Modern British dining at historic Borough Market',
  },
  {
    id: 'v23',
    name: 'London Heritage Tours',
    category: 'tour',
    location: 'London',
    contact: {
      phone: '+44 20 7345 6789',
      email: 'tours@londonheritage.com',
      website: 'https://londonheritagetours.com',
    },
    rating: 4.9,
    verified: true,
    services: ['Royal Tours', 'Museum Passes', 'Thames Cruises', 'Harry Potter Tours'],
    priceRange: '$$',
    description: 'Award-winning historical and cultural tours',
  },
  {
    id: 'v24',
    name: 'Transport for London',
    category: 'transport',
    location: 'London',
    contact: {
      phone: '+44 343 222 1234',
      email: 'customer.services@tfl.gov.uk',
      website: 'https://tfl.gov.uk',
    },
    rating: 4.3,
    verified: true,
    services: ['Oyster Cards', 'Visitor Passes', 'Airport Links', 'Journey Planning'],
    priceRange: '$',
    description: 'Official London public transport services',
  },
  {
    id: 'v25',
    name: 'London Medical Clinic',
    category: 'emergency',
    location: 'London',
    contact: {
      phone: '+44 20 7456 7890',
      email: 'emergency@londonmedical.co.uk',
      website: 'https://londonmedicalclinic.co.uk',
    },
    rating: 4.7,
    verified: true,
    services: ['Walk-in Clinic', '24/7 GP Services', 'Travel Vaccinations', 'Prescriptions'],
    priceRange: '$$',
    description: 'Private medical clinic serving international visitors',
  },

  // Dubai Vendors
  {
    id: 'v26',
    name: 'Burj View Hotel',
    category: 'hotel',
    location: 'Dubai',
    contact: {
      phone: '+971 4-123-4567',
      email: 'reservations@burjview.ae',
      website: 'https://burjviewhotel.ae',
    },
    rating: 4.8,
    verified: true,
    services: ['5-Star Accommodation', 'Rooftop Pool', 'Spa', 'Fine Dining', 'Burj Khalifa View'],
    priceRange: '$$$',
    description: 'Luxury hotel with stunning Burj Khalifa views',
  },
  {
    id: 'v27',
    name: 'Arabian Nights Restaurant',
    category: 'restaurant',
    location: 'Dubai',
    contact: {
      phone: '+971 4-234-5678',
      email: 'bookings@arabiannights.ae',
      website: 'https://arabiannights.ae',
    },
    rating: 4.7,
    verified: true,
    services: ['Middle Eastern Cuisine', 'Shisha Lounge', 'Live Entertainment', 'Desert View'],
    priceRange: '$$',
    description: 'Authentic Arabian dining experience with entertainment',
  },
  {
    id: 'v28',
    name: 'Dubai Desert Adventures',
    category: 'tour',
    location: 'Dubai',
    contact: {
      phone: '+971 50-123-4567',
      email: 'info@dubaidesert.ae',
      website: 'https://dubaidesertadventures.ae',
    },
    rating: 4.9,
    verified: true,
    services: ['Desert Safari', 'Dune Bashing', 'Camel Rides', 'City Tours', 'Yacht Charters'],
    priceRange: '$$',
    description: 'Premier desert and city adventure experiences',
  },
  {
    id: 'v29',
    name: 'Dubai Metro & RTA',
    category: 'transport',
    location: 'Dubai',
    contact: {
      phone: '+971 800-9090',
      email: 'customercare@rta.ae',
      website: 'https://rta.ae',
    },
    rating: 4.5,
    verified: true,
    services: ['Metro Cards', 'Taxi Services', 'Bus Passes', 'Nol Cards'],
    priceRange: '$',
    description: 'Dubai\'s comprehensive public transportation network',
  },
  {
    id: 'v30',
    name: 'Dubai International Medical',
    category: 'emergency',
    location: 'Dubai',
    contact: {
      phone: '+971 4-345-6789',
      email: 'emergency@dubaimed.ae',
      website: 'https://dubaimedical.ae',
    },
    rating: 4.8,
    verified: true,
    services: ['24/7 Emergency', 'Multi-specialty Hospital', 'International Staff', 'Air Ambulance'],
    priceRange: '$$$',
    description: 'World-class medical facility with international standards',
  },
];

/**
 * Mock Place Insights Database
 * Comprehensive travel information for popular destinations
 */
export const placeInsights: PlaceInsight[] = [
  {
    destination: 'Paris',
    bestTimeToVisit: 'April-June and September-October',
    averageCost: '$150-250/day',
    topAttractions: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral', 'Arc de Triomphe', 'Sacré-Cœur', 'Versailles Palace'],
    warnings: ['Pickpockets in metro and tourist areas', 'Many museums closed on Mondays or Tuesdays', 'August is vacation month - many locals away'],
    seasonalNotes: 'Summer (July-August) is peak season with crowds and high prices. Winter is cold but magical with fewer tourists.',
    visaRequirements: 'Schengen visa required for non-EU citizens. US/Canada/Australia get 90 days visa-free.',
    language: 'French (English spoken in tourist areas, learning basic French phrases appreciated)',
    currency: 'EUR (Euro)',
    tips: [
      'Buy Museum Pass for skip-the-line access',
      'Metro is fastest way to get around',
      'Restaurants charge for tap water - ask for "carafe d\'eau"',
      'Tipping 5-10% is customary',
      'Book popular restaurants weeks in advance',
    ],
  },
  {
    destination: 'Tokyo',
    bestTimeToVisit: 'March-May (cherry blossoms) and September-November',
    averageCost: '$100-200/day',
    topAttractions: ['Senso-ji Temple', 'Shibuya Crossing', 'Tsukiji Fish Market', 'Meiji Shrine', 'Tokyo Skytree', 'Akihabara'],
    warnings: ['Typhoon season July-October', 'Very crowded during Golden Week (late April-early May)', 'Language barrier outside tourist areas'],
    seasonalNotes: 'Cherry blossom season (late March-early April) is stunning but extremely crowded. Summer is hot and humid.',
    visaRequirements: 'Many nationalities get 90-day visa-free entry. Check Japan embassy website.',
    language: 'Japanese (limited English outside major tourist areas, download translation app)',
    currency: 'JPY (Japanese Yen) - cash still widely used',
    tips: [
      'Get JR Pass before arriving (not sold in Japan)',
      'Carry cash - many places don\'t accept cards',
      'Shoes off when entering homes and some restaurants',
      'Learn basic phrases: "Sumimasen" (excuse me), "Arigato" (thank you)',
      'Download offline maps - WiFi not always available',
      'Convenience stores (konbini) are everywhere and have great food',
    ],
  },
  {
    destination: 'Bali',
    bestTimeToVisit: 'April-October (dry season)',
    averageCost: '$50-100/day',
    topAttractions: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Mount Batur', 'Uluwatu Temple', 'Sacred Monkey Forest', 'Tegallalang'],
    warnings: ['Monsoon season November-March', 'Aggressive monkeys at temples', 'Scams targeting tourists', 'Traffic congestion in Seminyak/Canggu'],
    seasonalNotes: 'Dry season (May-September) is best for beaches. Wet season offers lower prices but frequent afternoon rains.',
    visaRequirements: 'Visa on arrival for most nationalities ($35 USD for 30 days). Extendable once for 30 more days.',
    language: 'Indonesian and Balinese (English widely spoken in tourist areas)',
    currency: 'IDR (Indonesian Rupiah) - ATMs widely available',
    tips: [
      'Rent scooter with helmet - main transport option',
      'Negotiate taxi prices before getting in',
      'Dress modestly when visiting temples',
      'Stay in Ubud for culture, Seminyak for beaches',
      'Try local warungs for authentic cheap food',
      'Bring reef-safe sunscreen to protect coral',
    ],
  },
  {
    destination: 'New York',
    bestTimeToVisit: 'September-November and April-June',
    averageCost: '$200-350/day',
    topAttractions: ['Statue of Liberty', 'Central Park', 'Empire State Building', 'Times Square', 'Brooklyn Bridge', 'Metropolitan Museum'],
    warnings: ['Very expensive city', 'Crowded during holidays', 'Subway delays common', 'Tipping expected everywhere (18-20%)'],
    seasonalNotes: 'Summer is hot and humid. Winter can be very cold with snow. Spring and fall offer pleasant weather.',
    visaRequirements: 'US visa required for most nationalities. Canadians visa-free. ESTA for visa waiver countries.',
    language: 'English (extremely diverse - 800+ languages spoken)',
    currency: 'USD (US Dollar) - cards accepted everywhere',
    tips: [
      'Get unlimited MetroCard for subway',
      'Buy Broadway tickets in advance or try lottery',
      'Avoid Times Square restaurants - tourist traps',
      'Explore different boroughs - not just Manhattan',
      'Free museum days: many offer pay-what-you-wish hours',
      'Download Citymapper app for navigation',
    ],
  },
  {
    destination: 'London',
    bestTimeToVisit: 'May-September (warmest weather)',
    averageCost: '$150-250/day',
    topAttractions: ['Tower of London', 'British Museum', 'Buckingham Palace', 'London Eye', 'Big Ben', 'Hyde Park'],
    warnings: ['Expensive accommodation', 'Rain year-round', 'Tube gets very crowded rush hours', 'Museum queues can be long'],
    seasonalNotes: 'Summer has longest days but most tourists. Winter is cold and dark but festive with Christmas markets.',
    visaRequirements: 'UK visa required for many nationalities. EU citizens need passport (not ID card) post-Brexit.',
    language: 'English (dozens of accents and dialects)',
    currency: 'GBP (British Pound) - one of the most expensive currencies',
    tips: [
      'Get Oyster Card for transport - much cheaper than single tickets',
      'Many museums are free (British Museum, National Gallery, Tate Modern)',
      'Book popular restaurants 2-3 weeks ahead',
      'Theatre tickets can be cheap with day-of lottery',
      'Walk or take bus for sightseeing - Underground misses views',
      'Sunday roast is a must-try British tradition',
    ],
  },
  {
    destination: 'Dubai',
    bestTimeToVisit: 'November-March (cooler months)',
    averageCost: '$150-300/day',
    topAttractions: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Dubai Marina', 'Gold Souk', 'Desert Safari'],
    warnings: ['Extremely hot May-September (40-50°C)', 'Strict laws on public behavior', 'Very expensive alcohol', 'No public displays of affection'],
    seasonalNotes: 'Summer is unbearable outdoors. Winter is perfect weather but peak tourist season.',
    visaRequirements: 'Free visa on arrival for many Western countries (30-90 days). Check UAE embassy.',
    language: 'Arabic (English very widely spoken - business language)',
    currency: 'AED (UAE Dirham) - pegged to US Dollar (3.67 AED = 1 USD)',
    tips: [
      'Dress conservatively - shoulders and knees covered',
      'Friday is holy day - some closures',
      'Taxis are affordable and everywhere',
      'Book Burj Khalifa tickets online in advance',
      'Malls have extreme AC - bring light jacket',
      'Haggle at souks but not in malls',
      'Avoid traveling during Ramadan unless prepared for restrictions',
    ],
  },
];

/**
 * Helper function to find vendor by ID
 */
export function findVendorById(vendorId: string): Vendor | undefined {
  return vendors.find((v) => v.id === vendorId);
}

/**
 * Helper function to find place insight by destination
 */
export function findPlaceInsightByDestination(destination: string): PlaceInsight | undefined {
  return placeInsights.find((p) => p.destination.toLowerCase() === destination.toLowerCase());
}

/**
 * Mock Settlements Database
 * Tracks settlement payments between users per trip
 */
export const settlements: Map<string, Settlement[]> = new Map();
