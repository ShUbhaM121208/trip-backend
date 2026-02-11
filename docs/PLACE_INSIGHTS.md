# Place Insights Design & Implementation Strategy

## Overview

The Place Insights feature provides travelers with comprehensive destination information including attractions, costs, safety warnings, seasonal guidance, and practical tips. This document outlines the data sourcing strategy, implementation approach, and legal/ethical considerations.

---

## Current Implementation

### Data Structure

```typescript
interface PlaceInsight {
  destination: string;           // City or region name
  bestTimeToVisit: string;       // Optimal travel periods
  averageCost: string;           // Daily budget estimate
  topAttractions: string[];      // Must-see locations
  warnings: string[];            // Safety alerts and advisories
  seasonalNotes: string;         // Weather and seasonal considerations
  visaRequirements: string;      // Entry requirements
  language: string;              // Primary language and English availability
  currency: string;              // Local currency code
  tips: string[];                // Practical travel tips
}
```

### Supported Destinations

Currently **6 destinations** with comprehensive data:
1. **Paris** - Cultural attractions, safety warnings, visa info
2. **Tokyo** - Seasonal guidance, typhoon warnings, JR Pass tips
3. **Bali** - Visa on arrival, monsoon season, safety alerts
4. **New York** - Tipping culture, subway info, museum passes
5. **London** - Rain preparedness, museum free days, transport cards
6. **Dubai** - Strict laws, dress code, extreme heat warnings

### Data Seeding

All data currently stored in `mockDataStore.ts` as a seeded array. This allows:
- Fast read access (no API calls)
- Consistent development environment
- Easy testing and validation
- No external dependencies

---

## Production Data Sources

### 1. TripAdvisor API
**Purpose**: Attractions, ratings, reviews

**Data Extraction**:
```
GET https://api.tripadvisor.com/api/partner/2.0/location/{locationId}
- topAttractions: Extract from "Things to Do" ranked list
- averageCost: Derive from hotel/restaurant price levels
- rating: Aggregate from user reviews
```

**Legal Considerations**:
- ✅ Official API with commercial license available
- ✅ Attribution required: "Powered by TripAdvisor"
- ✅ Terms of Service allow commercial use with paid plan
- ⚠️ Rate limits: 500 requests/day (free tier), 10,000/day (paid)

**Implementation**:
```typescript
async function fetchTripAdvisorData(locationId: string) {
  const response = await fetch(
    `https://api.tripadvisor.com/api/partner/2.0/location/${locationId}`,
    {
      headers: {
        'X-TripAdvisor-API-Key': process.env.TRIPADVISOR_API_KEY,
      },
    }
  );
  // Parse and transform to PlaceInsight structure
}
```

---

### 2. WikiVoyage (Wikimedia)
**Purpose**: Travel guides, tips, warnings

**Data Extraction**:
```
GET https://en.wikivoyage.org/w/api.php?action=parse&page=Paris&format=json
- seasonalNotes: Extract from "Climate" section
- tips: Parse from "Stay safe", "Respect", "Get around" sections
- warnings: Extract from "Stay safe" section
```

**Legal Considerations**:
- ✅ CC-BY-SA 3.0 license (free to use, attribution required)
- ✅ Can be used commercially
- ✅ Attribution: "Content from WikiVoyage"
- ✅ No rate limits (but be respectful)

**Ethical Scraping**:
```typescript
// Respect robots.txt
// Rate limit: 1 request per second
// Cache for 30 days
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

async function fetchWikiVoyage(destination: string) {
  // Check cache first
  const cached = getCache(`wikivoyage:${destination}`);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Respect rate limit
  await delay(1000); // 1 second between requests

  const response = await fetch(
    `https://en.wikivoyage.org/w/api.php?action=parse&page=${destination}&format=json`
  );
  
  // Cache result
  setCache(`wikivoyage:${destination}`, { data: parsed, timestamp: Date.now() });
}
```

---

### 3. Government Travel Advisories
**Purpose**: Safety warnings, visa requirements

**Data Sources**:
- **US State Department**: https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html
- **UK Foreign Office**: https://www.gov.uk/foreign-travel-advice
- **Australian DFAT**: https://www.smartraveller.gov.au

**Legal Considerations**:
- ✅ Public domain (government data)
- ✅ No copyright restrictions
- ✅ Attribution appreciated but not required

**Data Extraction**:
```typescript
// US State Department has JSON API
GET https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/{country}/_jcr_content.json

// Extract warnings and visa info
- warnings: Parse "Safety and Security" section
- visaRequirements: Extract "Entry, Exit and Visa Requirements"
```

---

### 4. Historical Booking Data (Internal)
**Purpose**: Average costs, popular periods

**Data Source**: Internal database (user bookings, expenses)

**Calculation**:
```sql
-- Average daily cost for destination
SELECT 
  AVG(totalSpent / DATEDIFF(endDate, startDate)) as avgDailySpent,
  destination
FROM trips
WHERE destination = 'Paris'
GROUP BY destination;

-- Popular months (best time to visit)
SELECT 
  MONTH(startDate) as month,
  COUNT(*) as bookings
FROM trips
WHERE destination = 'Paris'
GROUP BY MONTH(startDate)
ORDER BY bookings DESC;
```

**Privacy Considerations**:
- ✅ Aggregate data only (no individual user data)
- ✅ GDPR compliant (anonymized statistics)
- ✅ Minimum 100 trips threshold for inclusion

---

## Web Scraping Strategy

### robots.txt Compliance

**Always check and respect robots.txt**:

```typescript
import robotsParser from 'robots-parser';

async function canScrape(url: string) {
  const robotsTxt = await fetch(`${new URL(url).origin}/robots.txt`);
  const robots = robotsParser(url, await robotsTxt.text());
  
  return robots.isAllowed(url, 'MyBot/1.0');
}
```

### Rate Limiting

**Implement exponential backoff**:

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private minDelay = 1000; // 1 second minimum

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        await this.delay(this.minDelay);
      }
    }
    
    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Caching Strategy

```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry>();

  set(key: string, data: any, ttlMs: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
}

// Cache place insights for 30 days
const PLACE_INSIGHTS_TTL = 30 * 24 * 60 * 60 * 1000;
```

---

## Legal & Ethical Considerations

### Copyright & Fair Use

| Source | License | Commercial Use | Attribution | Scraping Allowed |
|--------|---------|----------------|-------------|------------------|
| TripAdvisor API | Proprietary | ✅ (Paid) | ✅ Required | ✅ Via API |
| WikiVoyage | CC-BY-SA 3.0 | ✅ Yes | ✅ Required | ✅ Yes |
| Gov Advisories | Public Domain | ✅ Yes | ⚠️ Optional | ✅ Yes |
| Google Places | Proprietary | ✅ (Paid) | ✅ Required | ❌ API Only |
| Booking.com | Proprietary | ❌ No | N/A | ❌ Prohibited |

### GDPR Compliance

**User Data Protection**:
```typescript
// ✅ GOOD: Aggregate statistics
const avgCost = trips.aggregate({ avg: 'totalSpent' });

// ❌ BAD: Expose individual user data
const userTrips = trips.find({ userId: 'u123' });
```

**Data Retention**:
- Scraped data: 30 days cache, then refresh
- User contributions: Indefinite (with consent)
- Deleted user data: 30-day soft delete, then permanent removal

### Terms of Service

**Review ToS before scraping**:

```typescript
// Example ToS check
const tosCompliance = {
  tripadvisor: {
    allowScraping: false,  // Must use API
    apiAvailable: true,
    attribution: 'Powered by TripAdvisor',
  },
  wikivoyage: {
    allowScraping: true,
    apiAvailable: true,
    attribution: 'Content from WikiVoyage (CC-BY-SA 3.0)',
  },
  booking: {
    allowScraping: false,  // Explicitly prohibited
    apiAvailable: true,    // Affiliate program only
    attribution: 'Required',
  },
};
```

---

## Update Frequency

| Data Type | Update Frequency | Reason |
|-----------|------------------|--------|
| Attractions | Quarterly (3 months) | Rarely change |
| Costs | Monthly | Inflation, seasonality |
| Safety Warnings | Real-time (API polling) | Critical for traveler safety |
| Visa Requirements | Quarterly | Policy changes infrequent |
| Weather/Seasonal | Annually | Climate patterns stable |
| User Tips | On contribution | User-generated content |

---

## Implementation Roadmap

### Phase 1: Current (Seeded Data) ✅
- 6 destinations with comprehensive data
- Fast read access from mockDataStore
- No external dependencies
- **Status**: Complete

### Phase 2: API Integration (3 months)
- Integrate TripAdvisor API for attractions
- WikiVoyage parser for travel tips
- Government API for visa/safety warnings
- **Estimated Effort**: 40 hours

### Phase 3: User Contributions (6 months)
- Allow verified users to submit tips
- Moderation workflow
- Upvote/downvote system
- **Estimated Effort**: 80 hours

### Phase 4: Real-time Updates (9 months)
- Weather API integration
- Event calendar (festivals, holidays)
- Safety score (aggregate from multiple sources)
- **Estimated Effort**: 60 hours

---

## Error Handling

```typescript
async function getPlaceInsight(destination: string): Promise<PlaceInsight> {
  try {
    // Try cache first
    const cached = cache.get(`place:${destination}`);
    if (cached) return cached;

    // Try API sources
    const [tripadvisor, wikivoyage, govWarnings] = await Promise.allSettled([
      fetchTripAdvisor(destination),
      fetchWikiVoyage(destination),
      fetchGovWarnings(destination),
    ]);

    // Merge data from successful sources
    const merged = mergePlaceData(tripadvisor, wikivoyage, govWarnings);
    
    // Cache result
    cache.set(`place:${destination}`, merged, PLACE_INSIGHTS_TTL);
    
    return merged;

  } catch (error) {
    // Fallback to seeded data
    return fallbackPlaceInsights[destination] || generateGenericInsight(destination);
  }
}
```

---

## Monitoring & Compliance

### Metrics to Track
- API rate limit usage
- Cache hit rate (target: >80%)
- Data freshness (age of cached data)
- Failed API calls (alert if >5%)
- ToS violations detected

### Alerting
```typescript
// Alert if approaching rate limits
if (apiCallsToday > API_DAILY_LIMIT * 0.8) {
  sendAlert('Approaching TripAdvisor API rate limit');
}

// Alert if data is stale
if (cacheAge > 60 * 24 * 60 * 60 * 1000) { // 60 days
  sendAlert(`Place insight for ${destination} is stale (${cacheAge} days old)`);
}
```

---

## Conclusion

This design balances **functionality**, **legality**, and **ethics**:

✅ **Legal**: Uses public APIs, respects ToS, proper attribution  
✅ **Ethical**: Respects robots.txt, rate limits, caches data  
✅ **Practical**: Fallback to seeded data, error handling  
✅ **Scalable**: Cache layer, queue system, monitoring  

The current seeded implementation provides immediate value while the architecture supports future API integration without code changes.
