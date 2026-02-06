# Edge Cases & Testing Documentation

## Overview

This document catalogs all edge cases identified in the Trip Companion platform, their current handling status, and testing strategies. The goal is clarity over coverage - documenting what we know about the system's boundaries.

---

## 1. Expense Splitting Edge Cases

### 1.1 Rounding & Precision

#### Edge Case: Three-Way Equal Split of $100
```typescript
Input: amount = 100, participants = 3, splitType = 'equal'
Raw calculation: $33.333... each
Rounded: [$33.33, $33.33, $33.33] = $99.99
Adjusted: [$33.34, $33.33, $33.33] = $100.00 ✓

Status: ✅ HANDLED
Location: expense.service.ts - calculateEqualSplits()
Test: ✅ Should be tested
```

#### Edge Case: Very Small Amount Split
```typescript
Input: amount = 0.03, participants = 3, splitType = 'equal'
Raw calculation: $0.01 each
Rounded: [$0.01, $0.01, $0.01] = $0.03 ✓

Alternate: amount = 0.01, participants = 3
Raw calculation: $0.003... each
Rounded: [$0.00, $0.00, $0.00] = $0.00
Adjusted: [$0.01, $0.00, $0.00] = $0.01 ✓

Status: ✅ HANDLED (algorithm adjusts largest split)
Consideration: Practical minimum should be $0.01 per split
Test: ⚠️ Edge case worth testing
```

#### Edge Case: Large Amount Split
```typescript
Input: amount = 9999999.99, participants = 3, splitType = 'equal'
Raw calculation: $3,333,333.33 each
Rounded: [$3,333,333.33, $3,333,333.33, $3,333,333.33] = $9,999,999.99 ✓

Status: ✅ HANDLED
Limitation: JavaScript number precision (15-17 digits)
Practical limit: Amounts < $1 trillion work fine
Test: ✅ Should test with realistic large amounts ($10K-$100K)
```

#### Edge Case: Percentage Split with Repeating Decimals
```typescript
Input: amount = 100, splits = [33.33%, 33.33%, 33.34%]
Calculated: [$33.33, $33.33, $33.34] = $100.00 ✓

Input: amount = 77.77, splits = [50%, 30%, 20%]
Calculated: [$38.885, $23.331, $15.554]
Rounded: [$38.89, $23.33, $15.55] = $77.77 ✓
Adjusted: [$38.88, $23.33, $15.56] = $77.77 ✓

Status: ✅ HANDLED
Algorithm: adjustSplitsForRounding() ensures exact match
Test: ✅ Critical test case
```

#### Edge Case: Accumulating Rounding Errors
```typescript
Scenario: 100 expenses, each split equally among 3 people
Per expense: Potential ±$0.01 error
Total potential error: ±$1.00

Current handling: Each expense independently rounded
Impact: Errors don't accumulate (each expense exact)

Status: ✅ HANDLED (by design)
Test: ✅ Should verify with large expense count
```

### 1.2 Split Type Validation

#### Edge Case: Zero Amount Expense
```typescript
Input: amount = 0, splitType = 'equal'

Status: ❌ REJECTED (validation)
Error: "Amount must be greater than 0"
Reasoning: Zero expenses don't make sense
Test: ✅ Should verify error handling
```

#### Edge Case: Negative Amount (Refund)
```typescript
Input: amount = -50, splitType = 'equal'

Status: ❌ REJECTED (validation)
Error: "Amount must be greater than 0"
Current: No refund support
Future: Consider refund/adjustment expense type
Test: ✅ Should verify rejection
```

#### Edge Case: Single Participant Split
```typescript
Input: amount = 100, participants = 1, splitType = 'equal'
Result: [{ userId: 'user-1', amount: 100.00 }]

Status: ✅ HANDLED
Note: User pays and owes $100, balance = $0
Use case: Solo trip with expense tracking
Test: ✅ Should verify balance is zero
```

#### Edge Case: Unequal Split with Zero Amount
```typescript
Input: amount = 100, splits = [
  { userId: 'user-1', amount: 100 },
  { userId: 'user-2', amount: 0 }
]

Status: ✅ ALLOWED
Use case: One person opts out of specific expense
Balance impact: user-2 owes nothing for this expense
Test: ✅ Should verify balance calculation
```

#### Edge Case: Percentage Split with 100% to One Person
```typescript
Input: amount = 100, splits = [
  { userId: 'user-1', percentage: 100 },
  { userId: 'user-2', percentage: 0 }
]

Status: ✅ ALLOWED
Validation: Percentages sum to 100% ✓
Use case: One person's personal expense in shared trip
Test: ✅ Should verify validation passes
```

#### Edge Case: Percentage Split Slightly Off 100%
```typescript
Input: splits = [33.33%, 33.33%, 33.33%]
Sum: 99.99%

Status: ✅ ALLOWED (0.01% tolerance)
Reasoning: UI rounding causes this commonly
Test: ✅ Should verify tolerance works

Input: splits = [33%, 33%, 33%]
Sum: 99%

Status: ❌ REJECTED
Error: "Percentages must sum to 100"
Reasoning: 1% discrepancy too large
Test: ✅ Should verify rejection
```

---

## 2. Balance Calculation Edge Cases

### 2.1 Multi-Currency Scenarios

#### Edge Case: All Expenses in Base Currency
```typescript
Trip: base currency USD
Expenses: All in USD
Result: No conversion needed, exact balances

Status: ✅ HANDLED (fast path)
Test: ✅ Baseline test case
```

#### Edge Case: Mixed Currency Expenses
```typescript
Trip: base currency USD
Expense 1: $100 USD
Expense 2: €92 EUR → $100 USD (converted)
Expense 3: ¥14,950 JPY → $100 USD (converted)

Total spent: $300 USD equivalent

Status: ✅ HANDLED
Note: Conversion happens at expense level
Limitation: Static exchange rates
Test: ✅ Critical multi-currency test
```

#### Edge Case: Currency Conversion Rounding
```typescript
Expense: €77.77 EUR, split equally among 3
Each pays: €25.92 EUR
Converted to USD: $28.17 each (at 0.92 rate)
Total: $84.51 USD (not exactly €77.77 converted)

Status: ⚠️ EXPECTED BEHAVIOR
Explanation: Each split converted individually
Impact: Minor discrepancy in trip total
Alternative: Convert total first, then split (not implemented)
Test: ✅ Should document this behavior
```

#### Edge Case: Unsupported Currency
```typescript
Input: currency = 'BTC'

Status: ❌ REJECTED
Error: "Unsupported currency: BTC"
Supported: USD, EUR, GBP, JPY, CAD, AUD, INR
Test: ✅ Should verify error handling
```

### 2.2 Balance States

#### Edge Case: All Balances Zero
```typescript
Scenario: Everyone pays exactly their share
Balances: All $0.00

Status: ✅ HANDLED
Settlements: Empty array (no settlements needed)
Test: ✅ Should verify empty settlements
```

#### Edge Case: One Person Pays Everything
```typescript
Trip: 3 people, $300 total expenses
Alex pays: $300
Sarah pays: $0
Mike pays: $0

Equal split: Each owes $100
Balances:
- Alex: +$200 (paid $300, owes $100)
- Sarah: -$100 (paid $0, owes $100)
- Mike: -$100 (paid $0, owes $100)

Settlements:
- Sarah → Alex: $100
- Mike → Alex: $100

Status: ✅ HANDLED
Test: ✅ Common scenario, should test
```

#### Edge Case: Balances Close to Zero
```typescript
Balances: [+$0.005, -$0.005]
Rounded: [$0.00, $0.00]

Status: ✅ HANDLED
Threshold: 0.01 (balances < $0.01 ignored)
Settlements: None created (below threshold)
Test: ✅ Should verify threshold behavior
```

#### Edge Case: Balance Sum Not Exactly Zero
```typescript
Due to rounding: Sum = $0.01
Balances: [+$130.01, -$65.00, -$65.00]
Sum: $0.01 (not zero)

Status: ⚠️ ACCEPTABLE
Tolerance: Within ±$0.01 per participant acceptable
Total error: Should be < $0.10 for 10 people
Test: ✅ Should verify error bounds
```

---

## 3. Settlement Optimization Edge Cases

### 3.1 Greedy Algorithm Limits

#### Edge Case: Optimal vs Greedy Difference
```typescript
Balances:
- A: +$10, B: +$10
- C: -$5, D: -$5, E: -$5, F: -$5

Greedy solution: 8 transactions
- C → A: $5
- D → A: $5
- E → B: $5
- F → B: $5
(Actually results in 4 transactions with good ordering)

Optimal solution: 4 transactions
- C → A: $5
- D → A: $5
- E → B: $5
- F → B: $5

Status: ✅ ACCEPTABLE
Note: Greedy often optimal, rarely more than +1 transaction
Test: ✅ Should test various configurations
```

#### Edge Case: Single Creditor, Many Debtors
```typescript
Creditor: Alex (+$500)
Debtors: 5 people (-$100 each)

Greedy result: 5 transactions (optimal)
All debtors pay Alex

Status: ✅ OPTIMAL
Test: ✅ Should verify correctness
```

#### Edge Case: Single Debtor, Many Creditors
```typescript
Debtor: Mike (-$500)
Creditors: 5 people (+$100 each)

Greedy result: 5 transactions (optimal)
Mike pays all creditors

Status: ✅ OPTIMAL
Test: ✅ Should verify correctness
```

#### Edge Case: Settlement Amount Below Threshold
```typescript
Balance: User owes $0.005
Rounded: $0.00

Status: ✅ IGNORED (below 0.01 threshold)
Reasoning: Don't ask for $0.01 payments
Test: ✅ Should verify no settlement created
```

### 3.2 Complex Settlement Patterns

#### Edge Case: Circular Debts
```typescript
Alex owes Sarah $50
Sarah owes Mike $50
Mike owes Alex $50

Expected: No settlements (net zero)
Actual balances: All $0.00 (algorithm handles this)

Status: ✅ HANDLED
Test: ✅ Should test circular scenarios
```

#### Edge Case: Partial Settlements
```typescript
Creditor: Alex (+$485)
Debtor 1: Mike (-$250)
Debtor 2: Sarah (-$235)

Step 1: Mike → Alex: $250
        Alex remaining: $235

Step 2: Sarah → Alex: $235
        Both settled

Status: ✅ HANDLED
Algorithm: Greedy matching handles partial amounts
Test: ✅ Should verify step-by-step
```

---

## 4. Budget Tracking Edge Cases

### 4.1 Budget Allocation

#### Edge Case: Zero Budget
```typescript
Input: Trip budget = $0

Status: ⚠️ ALLOWED (should probably reject)
Impact: All categories allocated $0
Percentage calculations: 0/0 = 0%
Test: ✅ Should verify behavior or add validation
```

#### Edge Case: Negative Budget
```typescript
Input: Trip budget = -1000

Status: ❌ REJECTED (validation)
Error: "Budget must be greater than 0"
Test: ✅ Should verify rejection
```

#### Edge Case: Overspending
```typescript
Budget: $1000
Spent: $1500

Status: ✅ ALLOWED
Display: 150% of budget spent
Alert: Over budget warning (future feature)
Test: ✅ Should verify percentage calculation
```

#### Edge Case: Custom Category Allocation Zero
```typescript
Budget: $1000
Allocation: accommodation = $0, transport = $1000

Status: ✅ ALLOWED
Use case: Skip accommodation (camping trip)
Test: ✅ Should verify flexibility
```

### 4.2 Category Spending

#### Edge Case: Spend Without Allocation
```typescript
Budget: Allocated $0 to shopping
Expenses: $500 shopping expenses

Status: ✅ HANDLED
Display: $500/$0 = ∞% (handle div by zero)
Test: ⚠️ Should verify UI doesn't break
```

#### Edge Case: Multiple Currencies in Category
```typescript
Category: Food
Expense 1: $50 USD
Expense 2: €50 EUR → $54.35 USD
Total: $104.35 USD

Status: ✅ HANDLED
Conversion: Automatic to base currency
Test: ✅ Should verify correct aggregation
```

---

## 5. Loyalty System Edge Cases

### 5.1 Point Calculation

#### Edge Case: New User (Zero Points)
```typescript
User: Just joined, no trips
Points: 0
Tier: Bronze

Status: ✅ HANDLED
Test: ✅ Should verify default state
```

#### Edge Case: Exactly at Tier Threshold
```typescript
User: 2500 points (exactly silver threshold)
Expected tier: Silver

Status: ✅ HANDLED (threshold is inclusive)
Test: ✅ Should verify boundary condition
```

#### Edge Case: Negative Points (Not Possible)
```typescript
Points never decrease in current design

Status: ✅ BY DESIGN
Limitation: No penalty system
Test: ✅ Should verify points only increase
```

### 5.2 Tier Progression

#### Edge Case: Max Tier with Excess Points
```typescript
User: 10,000 points (Gold threshold is 5000)
Tier: Gold
Next tier points: 0 (at max)

Status: ✅ HANDLED
Display: "Max tier reached"
Test: ✅ Should verify next tier = 0
```

---

## 6. Intelligence (AI) Edge Cases

### 6.1 Mock Response Handling

#### Edge Case: Empty Chat History
```typescript
User: First message
History: Empty

Status: ✅ HANDLED
Response: Welcome message
Test: ✅ Should verify initialization
```

#### Edge Case: Very Long Message
```typescript
User: 5000 character message

Status: ✅ ACCEPTED (no limit)
Limitation: No token limit checking
Future: Truncate or reject long messages
Test: ⚠️ Should add validation
```

#### Edge Case: Special Characters in Message
```typescript
User: Message with emojis, unicode, SQL injection attempts

Status: ⚠️ STORED AS-IS
Limitation: No sanitization
Security: Low risk (in-memory only, no DB)
Test: ✅ Should verify no crashes
```

---

## 7. Support System Edge Cases

### 7.1 Ticket Management

#### Edge Case: Empty Subject
```typescript
Input: subject = ""

Status: ❌ REJECTED
Error: "Subject is required"
Test: ✅ Should verify validation
```

#### Edge Case: Very Long Description
```typescript
Input: description = 10,000 characters

Status: ✅ ACCEPTED (no limit)
Consideration: Should add reasonable limit
Test: ⚠️ Should test with large input
```

#### Edge Case: Invalid Status Transition
```typescript
Current: resolved
Attempt: Set to open (reopening)

Status: ✅ ALLOWED (no restrictions)
Design: Simple state machine, any transition allowed
Test: ✅ Should verify flexibility
```

---

## 8. Data Persistence Edge Cases

### 8.1 In-Memory Storage Limits

#### Edge Case: Server Restart
```typescript
Action: Restart server
Result: ALL DATA LOST

Status: ⚠️ EXPECTED LIMITATION
Workaround: Don't restart server in demo
Future: Database persistence
Test: N/A (expected behavior)
```

#### Edge Case: Large Dataset (Memory)
```typescript
Scenario: 1000 trips, 50,000 expenses
Memory: ~50MB (estimated)

Status: ⚠️ ACCEPTABLE for development
Limitation: No pagination, all data loaded
Future: Database with pagination
Test: ⚠️ Should load test with realistic data
```

#### Edge Case: Concurrent Modifications
```typescript
Request 1: Update expense
Request 2: Delete expense (simultaneous)

Status: ⚠️ RACE CONDITION
Limitation: No transaction support
Risk: Low (development only)
Future: Database transactions
Test: ❌ Not tested (concurrency testing complex)
```

---

## 9. API Edge Cases

### 9.1 Request Validation

#### Edge Case: Missing Required Field
```typescript
POST /trips without "name"

Status: ❌ REJECTED (Zod validation)
Response: 400 Bad Request with field error
Test: ✅ Should verify all required fields
```

#### Edge Case: Invalid Date Format
```typescript
Input: startDate = "2026-13-45" (invalid)

Status: ❌ REJECTED
Error: "Invalid date format"
Test: ✅ Should verify date validation
```

#### Edge Case: Invalid Enum Value
```typescript
Input: category = "invalid-category"

Status: ❌ REJECTED (Zod validation)
Error: "Invalid enum value"
Test: ✅ Should verify enum validation
```

### 9.2 Resource Not Found

#### Edge Case: Delete Non-Existent Resource
```typescript
DELETE /trips/non-existent-id

Status: ❌ REJECTED
Response: 404 Not Found
Test: ✅ Should verify error handling
```

#### Edge Case: Update with Invalid ID
```typescript
PUT /trips/xyz-invalid

Status: ❌ REJECTED
Response: 404 Not Found
Test: ✅ Should verify ID validation
```

---

## 10. Rounding Tolerance Summary

### System-Wide Tolerance Standards

| Context | Tolerance | Reasoning |
|---------|-----------|-----------|
| **Expense splits** | ±$0.01 per split | Acceptable for currency precision |
| **Balance calculation** | ±$0.01 per user | Cumulative split rounding |
| **Settlement threshold** | <$0.01 ignored | Don't create micro-payments |
| **Percentage validation** | ±0.01% | UI rounding (99.99% vs 100%) |
| **Currency conversion** | ±$0.01 per conversion | Exchange rate precision |
| **Total balance sum** | ±$0.10 for 10 users | Acceptable cumulative error |

### Why These Tolerances?

1. **$0.01 is 1 cent** - Smallest currency unit for most currencies
2. **Floating-point arithmetic** - JavaScript number precision limits
3. **User convenience** - No one wants to pay $0.01
4. **Cumulative errors** - Multiple operations can accumulate small errors
5. **Practical limits** - Real-world scenarios don't need more precision

---

## 11. Test Coverage Strategy

### High Priority (Must Test)

1. ✅ **Expense splitting** - All three types with rounding
2. ✅ **Balance calculation** - Multi-currency, edge amounts
3. ✅ **Settlement optimization** - Various debtor/creditor patterns
4. ✅ **Rounding adjustment** - Verify exact totals
5. ✅ **Validation** - All input edge cases

### Medium Priority (Should Test)

6. ✅ **Budget tracking** - Category aggregation
7. ✅ **Currency conversion** - All supported pairs
8. ✅ **Loyalty points** - Tier progression
9. ✅ **API validation** - Zod schema edge cases

### Low Priority (Nice to Test)

10. ✅ **Mock AI responses** - Coverage of patterns
11. ✅ **Support tickets** - State transitions
12. ✅ **Error messages** - User-friendly responses

---

## 12. Known Bugs & Issues

### Current Issues

1. **Budget with zero allocation**
   - Impact: Division by zero in percentage calculation
   - Workaround: Always allocate > $0
   - Fix: Add validation or handle div/0

2. **No pagination**
   - Impact: Slow with 100+ expenses
   - Workaround: Keep datasets small
   - Fix: Add pagination to API

3. **No rate limiting**
   - Impact: API can be abused
   - Workaround: Deploy behind rate-limited proxy
   - Fix: Add express-rate-limit

### Not Bugs (By Design)

1. **Data lost on restart** - In-memory storage
2. **No authentication** - Development phase
3. **Static exchange rates** - Mock implementation
4. **Greedy not optimal** - Acceptable tradeoff

---

## 13. Future Edge Cases to Consider

When implementing new features, consider:

1. **Receipt attachments** - File size limits, formats
2. **Recurring expenses** - End date handling, proration
3. **Partial settlements** - Payment tracking, disputes
4. **Trip templates** - Deep copy vs reference
5. **User deletion** - Cascade rules, expense ownership
6. **Split editing** - Recalculation, balance updates
7. **Currency rate changes** - Historical vs current rates
8. **Time zones** - Date handling across zones

---

## Conclusion

This document provides comprehensive coverage of edge cases across the Trip Companion platform. The key insight: **We document what we know about system boundaries, even if not all cases have explicit tests.**

The system is designed with reasonable tolerances and handles most edge cases gracefully. Where limitations exist, they are documented with workarounds and future fix priorities.

**Remember**: The goal is clarity, not perfection. This documentation helps developers understand system behavior at the boundaries.
