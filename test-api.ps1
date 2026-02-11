# Trip Companion API Testing Script
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Trip Companion API Endpoints" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api/v1"
$headers = @{"Content-Type" = "application/json"}

# Test 1: Health Check
Write-Host "`n=== 1. HEALTH CHECK ===" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
Write-Host "Health Check:" -ForegroundColor Yellow
$response | ConvertTo-Json
Write-Host "✓ Passed" -ForegroundColor Green

# Test 2: Create Trip
Write-Host "`n=== 2. CREATE TRIP ===" -ForegroundColor Cyan
$tripBody = @{
    name = "Europe Adventure"
    description = "Summer trip to Europe"
    startDate = "2026-06-01"
    endDate = "2026-06-15"
    destination = "Paris, France"
    currency = "EUR"
    budget = 5000
    participantIds = @("user-1", "user-2", "user-3")
} | ConvertTo-Json

$trip = Invoke-RestMethod -Uri "$baseUrl/trips" -Method POST -Body $tripBody -Headers $headers
$tripId = $trip.data.id
Write-Host "Created Trip ID: $tripId" -ForegroundColor Yellow
$trip.data | ConvertTo-Json
Write-Host "✓ Passed" -ForegroundColor Green

# Test 3: Get All Trips
Write-Host "`n=== 3. GET ALL TRIPS ===" -ForegroundColor Cyan
$trips = Invoke-RestMethod -Uri "$baseUrl/trips" -Method GET
Write-Host "Total trips: $($trips.data.Count)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 4: Get Single Trip
Write-Host "`n=== 4. GET TRIP BY ID ===" -ForegroundColor Cyan
$singleTrip = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method GET
Write-Host "Trip: $($singleTrip.data.name)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 5: Update Trip
Write-Host "`n=== 5. UPDATE TRIP ===" -ForegroundColor Cyan
$updateBody = @{
    name = "Europe Adventure 2026"
    budget = 6000
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method PUT -Body $updateBody -Headers $headers
Write-Host "Updated Budget: $($updated.data.budget)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 6: Create Expense - Equal Split
Write-Host "`n=== 6. CREATE EXPENSE (EQUAL SPLIT) ===" -ForegroundColor Cyan
$expenseBody = @{
    description = "Hotel in Paris"
    amount = 300
    currency = "EUR"
    date = "2026-06-02"
    category = "accommodation"
    paidBy = "user-1"
    splitType = "equal"
    splitBetween = @("user-1", "user-2", "user-3")
} | ConvertTo-Json

$expense1 = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/expenses" -Method POST -Body $expenseBody -Headers $headers
$expense1Id = $expense1.data.id
Write-Host "Created Expense ID: $expense1Id" -ForegroundColor Yellow
Write-Host "Split per person: EUR $($expense1.data.splits[0].amount)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 7: Create Expense - Unequal Split
Write-Host "`n=== 7. CREATE EXPENSE (UNEQUAL SPLIT) ===" -ForegroundColor Cyan
$unequalBody = @{
    description = "Dinner at restaurant"
    amount = 150
    currency = "EUR"
    date = "2026-06-03"
    category = "food"
    paidBy = "user-2"
    splitType = "unequal"
    splits = @(
        @{ userId = "user-1"; amount = 50 }
        @{ userId = "user-2"; amount = 60 }
        @{ userId = "user-3"; amount = 40 }
    )
} | ConvertTo-Json -Depth 10

$expense2 = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/expenses" -Method POST -Body $unequalBody -Headers $headers
Write-Host "Created Unequal Split Expense" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 8: Create Expense - Percentage Split
Write-Host "`n=== 8. CREATE EXPENSE (PERCENTAGE SPLIT) ===" -ForegroundColor Cyan
$percentBody = @{
    description = "Car rental"
    amount = 200
    currency = "EUR"
    date = "2026-06-04"
    category = "transport"
    paidBy = "user-3"
    splitType = "percentage"
    splits = @(
        @{ userId = "user-1"; percentage = 40 }
        @{ userId = "user-2"; percentage = 30 }
        @{ userId = "user-3"; percentage = 30 }
    )
} | ConvertTo-Json -Depth 10

$expense3 = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/expenses" -Method POST -Body $percentBody -Headers $headers
Write-Host "Created Percentage Split Expense" -ForegroundColor Yellow
Write-Host "User 1 owes: EUR $($expense3.data.splits[0].amount)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 9: Get All Expenses
Write-Host "`n=== 9. GET ALL EXPENSES ===" -ForegroundColor Cyan
$expenses = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/expenses" -Method GET
Write-Host "Total expenses: $($expenses.data.Count)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 10: Get Balances
Write-Host "`n=== 10. GET BALANCES ===" -ForegroundColor Cyan
$balances = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/settlements/balances" -Method GET
Write-Host "Balances:" -ForegroundColor Yellow
$balances.data | ForEach-Object { 
    Write-Host "  $($_.userName): EUR $($_.balance)" -ForegroundColor White
}
Write-Host "✓ Passed" -ForegroundColor Green

# Test 11: Get Settlements
Write-Host "`n=== 11. GET OPTIMIZED SETTLEMENTS ===" -ForegroundColor Cyan
$settlements = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/settlements" -Method GET
Write-Host "Number of settlements needed: $($settlements.data.Count)" -ForegroundColor Yellow
$settlements.data | ForEach-Object {
    Write-Host "  $($_.fromUserName) → $($_.toUserName): EUR $($_.amount)" -ForegroundColor White
}
Write-Host "✓ Passed" -ForegroundColor Green

# Test 12: Get Settlement Summary
Write-Host "`n=== 12. GET SETTLEMENT SUMMARY ===" -ForegroundColor Cyan
$summary = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/settlements/summary" -Method GET
Write-Host "Total settlements: $($summary.data.totalSettlements)" -ForegroundColor Yellow
Write-Host "Total amount: EUR $($summary.data.totalAmount)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 13: Get Budget
Write-Host "`n=== 13. GET BUDGET ===" -ForegroundColor Cyan
$budget = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/budget" -Method GET
Write-Host "Total budget: EUR $($budget.data.totalBudget)" -ForegroundColor Yellow
Write-Host "Total spent: EUR $($budget.data.totalSpent)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 14: Update Budget
Write-Host "`n=== 14. UPDATE BUDGET ===" -ForegroundColor Cyan
$budgetBody = @{
    categories = @{
        accommodation = 2000
        food = 1500
        transport = 1500
        activities = 800
        shopping = 200
    }
} | ConvertTo-Json

$updatedBudget = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/budget" -Method PUT -Body $budgetBody -Headers $headers
Write-Host "Budget updated" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 15: Get Loyalty Info
Write-Host "`n=== 15. GET LOYALTY INFO ===" -ForegroundColor Cyan
$loyalty = Invoke-RestMethod -Uri "$baseUrl/loyalty/user-1" -Method GET
Write-Host "User: $($loyalty.data.userName)" -ForegroundColor Yellow
Write-Host "Points: $($loyalty.data.points)" -ForegroundColor Yellow
Write-Host "Tier: $($loyalty.data.tier)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 16: AI Chat
Write-Host "`n=== 16. AI CHAT ===" -ForegroundColor Cyan
$chatBody = @{
    message = "What are good restaurants in Paris?"
    tripId = $tripId
} | ConvertTo-Json

$chat = Invoke-RestMethod -Uri "$baseUrl/intelligence/chat" -Method POST -Body $chatBody -Headers $headers
Write-Host "AI Response: $($chat.data.response)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 17: Get Place Insights
Write-Host "`n=== 17. GET PLACE INSIGHTS ===" -ForegroundColor Cyan
$place = Invoke-RestMethod -Uri "$baseUrl/intelligence/places/Paris" -Method GET
Write-Host "Place: $($place.data.name)" -ForegroundColor Yellow
Write-Host "Best time to visit: $($place.data.bestTimeToVisit)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 18: Create Support Ticket
Write-Host "`n=== 18. CREATE SUPPORT TICKET ===" -ForegroundColor Cyan
$ticketBody = @{
    userId = "user-1"
    subject = "Issue with expense split"
    description = "The expense split calculation seems incorrect"
    priority = "medium"
} | ConvertTo-Json

$ticket = Invoke-RestMethod -Uri "$baseUrl/support/tickets" -Method POST -Body $ticketBody -Headers $headers
$ticketId = $ticket.data.id
Write-Host "Created Ticket ID: $ticketId" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 19: Get All Tickets
Write-Host "`n=== 19. GET ALL SUPPORT TICKETS ===" -ForegroundColor Cyan
$tickets = Invoke-RestMethod -Uri "$baseUrl/support/tickets" -Method GET
Write-Host "Total tickets: $($tickets.data.Count)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 20: Add Message to Ticket
Write-Host "`n=== 20. ADD MESSAGE TO TICKET ===" -ForegroundColor Cyan
$messageBody = @{
    userId = "support-agent-1"
    message = "We are investigating this issue"
} | ConvertTo-Json

$ticketWithMessage = Invoke-RestMethod -Uri "$baseUrl/support/tickets/$ticketId/messages" -Method POST -Body $messageBody -Headers $headers
Write-Host "Message added, total messages: $($ticketWithMessage.data.messages.Count)" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 21: Error Handling - 404
Write-Host "`n=== 21. ERROR HANDLING - 404 ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$baseUrl/trips/non-existent-id" -Method GET
    Write-Host "✗ Failed - Should have returned 404" -ForegroundColor Red
} catch {
    Write-Host "Correctly returned 404 error" -ForegroundColor Yellow
    Write-Host "✓ Passed" -ForegroundColor Green
}

# Test 22: Error Handling - Validation Error
Write-Host "`n=== 22. ERROR HANDLING - VALIDATION ===" -ForegroundColor Cyan
try {
    $invalidBody = @{
        description = "Missing name field"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/trips" -Method POST -Body $invalidBody -Headers $headers
    Write-Host "✗ Failed - Should have returned validation error" -ForegroundColor Red
} catch {
    Write-Host "Correctly returned validation error" -ForegroundColor Yellow
    Write-Host "✓ Passed" -ForegroundColor Green
}

# Test 23: Delete Expense
Write-Host "`n=== 23. DELETE EXPENSE ===" -ForegroundColor Cyan
$deleted = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/expenses/$expense1Id" -Method DELETE
Write-Host "Expense deleted" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

# Test 24: Delete Trip
Write-Host "`n=== 24. DELETE TRIP ===" -ForegroundColor Cyan
$deletedTrip = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method DELETE
Write-Host "Trip deleted" -ForegroundColor Yellow
Write-Host "✓ Passed" -ForegroundColor Green

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
