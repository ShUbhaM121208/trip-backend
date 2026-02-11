/**
 * Intelligence Service
 * Business logic for AI assistant and place insights
 */

import type { ChatMessage, ChatMessageDto, PlaceInsight } from '@/shared/types';
import { chatHistory, findTripById, expenses, findPlaceInsightByDestination, trips } from '@/shared/data/mockDataStore';
import { generateMessageId } from '@/shared/utils/id.util';
import { getCurrentTimestamp } from '@/shared/utils/date.util';
import { createNotFoundError } from '@/shared/middleware/errorHandler';
import { createLogger } from '@/shared/utils/logger.util';
import {
  EXPENSE_ANALYSIS_TEMPLATE,
  BUDGET_OPTIMIZATION_TEMPLATE,
  HISTORICAL_COMPARISON_TEMPLATE,
  ConversationContext
} from './prompts';

/**
 * Service class handling AI assistant business logic
 */
export class IntelligenceService {
  private logger = createLogger('IntelligenceService');
  private conversationContexts = new Map<string, ConversationContext>();

  /**
   * Process chat message and generate AI response
   */
  async processMessage(dto: ChatMessageDto): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    const startTime = Date.now();
    
    // Log incoming request
    this.logger.info('Processing chat message', {
      tripId: dto.tripId,
      messageLength: dto.content.length,
      hasContext: !!dto.tripId
    });

    // Validate trip if tripId provided
    if (dto.tripId) {
      const trip = findTripById(dto.tripId);
      if (!trip) {
        this.logger.error('Trip not found', { tripId: dto.tripId });
        throw createNotFoundError('Trip', dto.tripId);
      }
    }

    // Get or create conversation context
    const chatKey = dto.tripId || 'global';
    let conversationContext = this.conversationContexts.get(chatKey);
    if (!conversationContext) {
      conversationContext = new ConversationContext();
      this.conversationContexts.set(chatKey, conversationContext);
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: dto.content,
      timestamp: getCurrentTimestamp(),
    };

    // Add to conversation context
    conversationContext.addMessage('user', dto.content);

    // Generate AI response (mock implementation with prompt templates)
    const responseContent = this.generateMockResponse(dto.content, dto.tripId);
    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: responseContent,
      timestamp: getCurrentTimestamp(),
    };

    // Add assistant response to conversation context
    conversationContext.addMessage('assistant', responseContent);

    // Store in chat history
    const history = chatHistory.get(chatKey) || [];
    history.push(userMessage, assistantMessage);
    chatHistory.set(chatKey, history);

    // Log completion
    const duration = Date.now() - startTime;
    this.logger.info('Chat message processed successfully', {
      tripId: dto.tripId,
      responseLength: responseContent.length,
      durationMs: duration,
      conversationLength: conversationContext.getSize()
    });

    return { userMessage, assistantMessage };
  }

  /**
   * Get chat history for a trip or global
   */
  getChatHistory(tripId?: string): ChatMessage[] {
    const chatKey = tripId || 'global';
    const history = chatHistory.get(chatKey) || [];
    
    this.logger.debug('Retrieved chat history', {
      tripId,
      messageCount: history.length
    });
    
    return history;
  }

  /**
   * Clear chat history
   */
  clearChatHistory(tripId?: string): void {
    const chatKey = tripId || 'global';
    const previousCount = chatHistory.get(chatKey)?.length || 0;
    
    chatHistory.delete(chatKey);
    
    // Clear conversation context
    this.conversationContexts.delete(chatKey);
    
    this.logger.info('Cleared chat history', {
      tripId,
      messagesCleared: previousCount
    });
  }

  /**
   * Generate mock AI response based on user input
   */
  private generateMockResponse(userInput: string, tripId?: string): string {
    const input = userInput.toLowerCase();

    this.logger.debug('Generating response', {
      inputLength: userInput.length,
      tripId,
      keywords: this.extractKeywords(input)
    });

    // Expense-related queries
    if (input.includes('expense') || input.includes('spending') || input.includes('spent') ||
        input.includes('breakdown') || input.includes('daily') || input.includes('rate')) {
      if (tripId) {
        return this.generateExpenseSummary(tripId);
      }
      return 'I can help you analyze expenses! Please specify a trip ID to get detailed expense information.';
    }

    // Who spent the most queries
    if (input.includes('who') && (input.includes('most') || input.includes('spent') || input.includes('paid'))) {
      if (tripId) {
        return this.generateTopSpender(tripId);
      }
      return 'I can tell you who spent the most! Please specify a trip ID.';
    }

    // Budget-related queries
    if (input.includes('budget') || input.includes('remaining') || input.includes('reduce') || input.includes('save')) {
      if (tripId) {
        return this.generateBudgetSummary(tripId);
      }
      return 'I can help you track your budget! Please specify a trip ID for budget details.';
    }

    // Historical comparison queries
    if (input.includes('compare') || input.includes('past') || input.includes('previous') || 
        input.includes('history') || input.includes('similar')) {
      if (tripId) {
        return this.generateHistoricalComparison(tripId);
      }
      return 'I can compare your current trip to past trips! Please specify a trip ID.';
    }

    // Pattern analysis queries
    if (input.includes('pattern') || input.includes('trend') || input.includes('insight')) {
      if (tripId) {
        return this.generatePatternAnalysis(tripId);
      }
      return 'I can analyze your spending patterns! Please specify a trip ID.';
    }

    // Settlement queries
    if (input.includes('owe') || input.includes('settle') || input.includes('balance')) {
      return 'To see who owes whom, check the Balances page. I can help calculate optimal settlements to minimize transactions.';
    }

    // Tips and recommendations
    if (input.includes('tip') || input.includes('advice') || input.includes('recommend')) {
      return this.generateTips();
    }

    // Help queries
    if (input.includes('help') || input.includes('how') || input.includes('what can')) {
      return 'I can help you with:\n\n' +
        '• Expense breakdown and analysis\n' +
        '• Budget tracking and recommendations\n' +
        '• Settlement calculations\n' +
        '• Tips for managing trip expenses\n' +
        '• Category-wise spending insights\n\n' +
        'Just ask me anything about your trip finances!';
    }

    // Default response
    return 'I\'m here to help with your trip expenses and budgeting! You can ask me about:\n\n' +
      '• Current expense breakdown\n' +
      '• Budget status and remaining funds\n' +
      '• Settlement recommendations\n' +
      '• Spending tips and advice\n\n' +
      'What would you like to know?';
  }

  /**
   * Generate expense summary for a trip
   */
  private generateExpenseSummary(tripId: string): string {
    const tripExpenses = expenses.filter((e) => e.tripId === tripId);

    if (tripExpenses.length === 0) {
      return 'No expenses recorded for this trip yet. Start tracking your spending to get insights!';
    }

    const categoryTotals = tripExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = tripExpenses.reduce((sum, e) => sum + e.amount, 0);

    let response = 'Here\'s your expense breakdown:\n\n';
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      const percentage = ((amount / total) * 100).toFixed(1);
      response += `• ${this.capitalizeCategory(category)}: $${amount.toFixed(2)} (${percentage}%)\n`;
    });

    response += `\nTotal: $${total.toFixed(2)} across ${tripExpenses.length} expenses`;

    return response;
  }

  /**
   * Generate budget summary
   */
  private generateBudgetSummary(tripId: string): string {
    const trip = findTripById(tripId);
    if (!trip) return 'Trip not found.';

    const percentage = ((trip.totalSpent / trip.budget) * 100).toFixed(1);
    const remaining = trip.budget - trip.totalSpent;

    let response = `Budget Status for ${trip.name}:\n\n`;
    response += `• Total Budget: $${trip.budget.toFixed(2)}\n`;
    response += `• Spent: $${trip.totalSpent.toFixed(2)} (${percentage}%)\n`;
    response += `• Remaining: $${remaining.toFixed(2)}\n\n`;

    if (remaining < 0) {
      response += '⚠️ You\'ve exceeded your budget! Consider reviewing your expenses.';
    } else if (parseFloat(percentage) > 90) {
      response += '⚠️ You\'re close to your budget limit. Spend carefully!';
    } else {
      response += '✅ You\'re on track with your budget.';
    }

    return response;
  }

  /**
   * Generate top spender analysis
   */
  private generateTopSpender(tripId: string): string {
    const tripExpenses = expenses.filter((e) => e.tripId === tripId);

    if (tripExpenses.length === 0) {
      return 'No expenses recorded for this trip yet.';
    }

    // Calculate total paid by each user
    const paidByUser = tripExpenses.reduce((acc, expense) => {
      const payerId = typeof expense.paidBy === 'string' ? expense.paidBy : expense.paidBy.id;
      acc[payerId] = (acc[payerId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Sort by amount paid (descending)
    const sorted = Object.entries(paidByUser)
      .sort(([, a], [, b]) => b - a);

    const topSpender = sorted[0];
    const total = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
    const topPercentage = ((topSpender[1] / total) * 100).toFixed(1);

    let response = `Top Spender Analysis:\n\n`;
    response += `🥇 ${topSpender[0]} has paid the most: $${topSpender[1].toFixed(2)} (${topPercentage}% of total)\n\n`;
    response += `All payments:\n`;
    sorted.forEach(([user, amount], index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•';
      const percentage = ((amount / total) * 100).toFixed(1);
      response += `${emoji} ${user}: $${amount.toFixed(2)} (${percentage}%)\n`;
    });

    return response;
  }

  /**
   * Generate general tips
   */
  private generateTips(): string {
    const tips = [
      '💡 Split expenses equally to simplify settlements later.',
      '💡 Track expenses daily to stay on top of your budget.',
      '💡 Use the local currency to avoid confusion with exchange rates.',
      '💡 Set aside 10-15% of your budget for unexpected expenses.',
      '💡 Review your spending by category to identify where you can save.',
      '💡 Settle balances at the end of each day to avoid large settlements.',
    ];

    return 'Here are some tips for managing trip expenses:\n\n' +
      tips.slice(0, 3).join('\n');
  }

  /**
   * Capitalize category name
   */
  private capitalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      accommodation: 'Accommodation',
      transport: 'Transport',
      food: 'Food & Dining',
      activities: 'Activities',
      shopping: 'Shopping',
      other: 'Other',
    };
    return categoryMap[category] || category;
  }

  /**
   * Extract keywords from user input for logging
   */
  private extractKeywords(input: string): string[] {
    const keywords = ['expense', 'budget', 'spending', 'compare', 'pattern', 'trend', 'past', 'history'];
    return keywords.filter(keyword => input.includes(keyword));
  }

  /**
   * Generate historical comparison analysis using past trips
   * HEURISTIC: Compares current trip to completed trips for insights
   */
  private generateHistoricalComparison(tripId: string): string {
    this.logger.info('Generating historical comparison', { tripId });

    const currentTrip = findTripById(tripId);
    if (!currentTrip) return 'Trip not found.';

    // Get completed past trips
    const pastTrips = trips.filter(t => 
      t.id !== tripId && 
      t.status === 'completed'
    );

    if (pastTrips.length === 0) {
      return 'No past trips available for comparison. This is your first trip!';
    }

    const currentTripExpenses = expenses.filter(e => e.tripId === tripId);
    const currentDailyAvg = currentTrip.totalSpent / Math.max(1, this.getTripDuration(currentTrip));

    // Calculate averages from past trips
    const pastTripStats = pastTrips.map(trip => {
      const tripExpenses = expenses.filter(e => e.tripId === trip.id);
      const duration = this.getTripDuration(trip);
      return {
        name: trip.name,
        totalSpent: trip.totalSpent,
        dailyAvg: trip.totalSpent / Math.max(1, duration),
        categoryBreakdown: this.getCategoryBreakdown(tripExpenses)
      };
    });

    const avgPastDailySpending = pastTripStats.reduce((sum, t) => sum + t.dailyAvg, 0) / pastTripStats.length;

    // Build context using prompt template
    const promptContext = HISTORICAL_COMPARISON_TEMPLATE.contextBuilder({
      currentTrip: {
        totalSpent: currentTrip.totalSpent,
        categoryBreakdown: this.getCategoryBreakdown(currentTripExpenses),
        duration: this.getTripDuration(currentTrip)
      },
      pastTrips: pastTripStats.map(stat => ({
        name: stat.name,
        totalSpent: stat.totalSpent,
        categoryBreakdown: stat.categoryBreakdown,
        duration: this.getTripDuration(currentTrip)
      }))
    });

    // Generate insights based on comparison
    let response = '📊 Historical Comparison Analysis\n\n';
    
    const comparison = currentDailyAvg > avgPastDailySpending ? 'higher' : 'lower';
    const percentDiff = Math.abs(((currentDailyAvg - avgPastDailySpending) / avgPastDailySpending) * 100).toFixed(1);

    response += `Your current trip daily spending ($${currentDailyAvg.toFixed(2)}) is ${comparison} than your past trips average ($${avgPastDailySpending.toFixed(2)}) by ${percentDiff}%.\n\n`;

    // Category comparison
    const currentCategories = this.getCategoryBreakdown(currentTripExpenses);
    const avgPastCategories = this.getAverageCategoryBreakdown(pastTripStats);

    response += '**Category Comparison (Current vs Past Average):**\n';
    Object.keys(currentCategories).forEach(category => {
      const currentPct = (currentCategories[category] / currentTrip.totalSpent) * 100;
      const pastPct = avgPastCategories[category] || 0;
      const diff = currentPct - pastPct;
      const arrow = diff > 5 ? '📈' : diff < -5 ? '📉' : '➡️';
      response += `${arrow} ${this.capitalizeCategory(category)}: ${currentPct.toFixed(1)}% (avg: ${pastPct.toFixed(1)}%)\n`;
    });

    response += `\n**Insights from Past Behavior:**\n`;
    if (currentDailyAvg > avgPastDailySpending * 1.2) {
      response += `• ⚠️ You're spending 20%+ more per day than usual. Consider reviewing expenses.\n`;
    } else if (currentDailyAvg < avgPastDailySpending * 0.8) {
      response += `• ✅ Great job! You're spending 20% less per day than your past trips.\n`;
    }

    // Find most similar past trip
    const mostSimilar = this.findMostSimilarTrip(currentTrip, pastTripStats);
    if (mostSimilar) {
      response += `• Your spending pattern is most similar to "${mostSimilar.name}"\n`;
    }

    this.logger.debug('Historical comparison generated', {
      tripId,
      pastTripsAnalyzed: pastTrips.length,
      currentDailyAvg,
      avgPastDailySpending
    });

    return response;
  }

  /**
   * Generate pattern analysis for spending trends
   * HEURISTIC: Analyzes time-based patterns and anomalies
   */
  private generatePatternAnalysis(tripId: string): string {
    this.logger.info('Generating pattern analysis', { tripId });

    const currentTrip = findTripById(tripId);
    if (!currentTrip) return 'Trip not found.';

    const tripExpenses = expenses.filter(e => e.tripId === tripId);

    if (tripExpenses.length === 0) {
      return 'No expenses recorded yet. Start adding expenses to see patterns!';
    }

    // Analyze patterns
    const patterns = this.analyzeSpendingPatterns(tripExpenses);

    let response = '🔍 Spending Pattern Analysis\n\n';

    // Day of week analysis
    if (patterns.dayOfWeek) {
      response += `**Day-of-Week Patterns:**\n`;
      response += `• Highest spending: ${patterns.dayOfWeek.highest.day} ($${patterns.dayOfWeek.highest.amount.toFixed(2)})\n`;
      response += `• Lowest spending: ${patterns.dayOfWeek.lowest.day} ($${patterns.dayOfWeek.lowest.amount.toFixed(2)})\n\n`;
    }

    // Category patterns
    response += `**Category Insights:**\n`;
    response += `• Most frequent: ${patterns.mostCommonCategory}\n`;
    response += `• Largest category: ${patterns.largestCategory.name} ($${patterns.largestCategory.amount.toFixed(2)})\n`;
    response += `• Average transaction: $${patterns.averageTransactionSize.toFixed(2)}\n\n`;

    // Spending velocity
    response += `**Spending Trend:**\n`;
    if (patterns.spendingTrend === 'increasing') {
      response += `• 📈 Spending is increasing over time. You might want to slow down.\n`;
    } else if (patterns.spendingTrend === 'decreasing') {
      response += `• 📉 Spending is decreasing. Good budget control!\n`;
    } else {
      response += `• ➡️ Spending is stable and consistent.\n`;
    }

    // Anomaly detection
    if (patterns.anomalies && patterns.anomalies.length > 0) {
      response += `\n**Unusual Expenses Detected:**\n`;
      patterns.anomalies.forEach(anomaly => {
        response += `• $${anomaly.amount.toFixed(2)} on ${anomaly.category} (${anomaly.date})\n`;
      });
    }

    this.logger.debug('Pattern analysis generated', {
      tripId,
      expenseCount: tripExpenses.length,
      trend: patterns.spendingTrend
    });

    return response;
  }

  /**
   * Get trip duration in days
   */
  private getTripDuration(trip: any): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get category breakdown from expenses
   */
  private getCategoryBreakdown(tripExpenses: any[]): Record<string, number> {
    return tripExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate average category breakdown from multiple trips
   */
  private getAverageCategoryBreakdown(tripStats: any[]): Record<string, number> {
    const allCategories = new Set<string>();
    tripStats.forEach(stat => {
      Object.keys(stat.categoryBreakdown).forEach(cat => allCategories.add(cat));
    });

    const avgBreakdown: Record<string, number> = {};
    allCategories.forEach(category => {
      const percentages = tripStats
        .map(stat => {
          const total = Object.values(stat.categoryBreakdown).reduce((sum: number, val) => sum + (val as number), 0);
          return total > 0 ? ((stat.categoryBreakdown[category] || 0) / total) * 100 : 0;
        });
      avgBreakdown[category] = percentages.reduce((sum, pct) => sum + pct, 0) / tripStats.length;
    });

    return avgBreakdown;
  }

  /**
   * Find most similar past trip based on category spending patterns
   */
  private findMostSimilarTrip(currentTrip: any, pastTripStats: any[]): any | null {
    if (pastTripStats.length === 0) return null;

    const currentExpenses = expenses.filter(e => e.tripId === currentTrip.id);
    const currentCategories = this.getCategoryBreakdown(currentExpenses);
    const currentTotal = Object.values(currentCategories).reduce((sum, val) => sum + val, 0);

    // Calculate similarity scores (simple cosine similarity on category percentages)
    const scores = pastTripStats.map(pastTrip => {
      const pastTotal = Object.values(pastTrip.categoryBreakdown).reduce((sum: number, val) => sum + (val as number), 0);
      
      let similarity = 0;
      const allCategories = new Set([
        ...Object.keys(currentCategories),
        ...Object.keys(pastTrip.categoryBreakdown)
      ]);

      allCategories.forEach(category => {
        const currentPct = ((currentCategories[category] || 0) / currentTotal) * 100;
        const pastPct = ((pastTrip.categoryBreakdown[category] || 0) / pastTotal) * 100;
        similarity += Math.abs(currentPct - pastPct);
      });

      return {
        trip: pastTrip,
        similarity: 100 - similarity // Convert difference to similarity
      };
    });

    scores.sort((a, b) => b.similarity - a.similarity);
    return scores[0].trip;
  }

  /**
   * Analyze spending patterns from expenses
   * HEURISTIC: Pattern detection using time-series analysis
   */
  private analyzeSpendingPatterns(tripExpenses: any[]): any {
    // Category frequency
    const categoryCount: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    
    tripExpenses.forEach(expense => {
      categoryCount[expense.category] = (categoryCount[expense.category] || 0) + 1;
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const mostCommonCategory = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)[0][0];

    const largestCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    // Average transaction size
    const averageTransactionSize = tripExpenses.reduce((sum, e) => sum + e.amount, 0) / tripExpenses.length;

    // Spending trend (simple linear regression)
    const amounts = tripExpenses.map(e => e.amount);
    const trend = this.calculateTrend(amounts);

    // Anomaly detection (expenses > 2 standard deviations from mean)
    const mean = averageTransactionSize;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
    );
    const threshold = mean + (2 * stdDev);
    const anomalies = tripExpenses
      .filter(e => e.amount > threshold)
      .map(e => ({
        amount: e.amount,
        category: e.category,
        date: e.date
      }));

    return {
      mostCommonCategory,
      largestCategory: {
        name: largestCategory[0],
        amount: largestCategory[1]
      },
      averageTransactionSize,
      spendingTrend: trend,
      anomalies
    };
  }

  /**
   * Calculate spending trend (increasing, decreasing, stable)
   */
  private calculateTrend(amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (amounts.length < 3) return 'stable';

    // Simple linear regression slope
    const n = amounts.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = amounts.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * amounts[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 5) return 'increasing';
    if (slope < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Get place insights for a destination
   * 
   * @param destination - City or region name
   * @returns Comprehensive travel information
   * @throws NotFoundError if destination not in database
   * 
   * PURPOSE:
   * - Provide travelers with essential destination information
   * - Help with trip planning (timing, budget, safety)
   * - Reduce trip surprises through warnings and tips
   * 
   * DATA SOURCES (Simulated):
   * - TripAdvisor API (attractions, ratings)
   * - WikiVoyage (travel guides)
   * - Government travel advisories (safety)
   * - Historical booking data (cost estimates)
   * 
   * SUPPORTED DESTINATIONS:
   * - Paris, Tokyo, Bali, New York, London, Dubai
   * - Total: 6 destinations with comprehensive data
   * 
   * FUTURE ENHANCEMENTS:
   * - Real-time API integration
   * - User-contributed tips
   * - Weather forecasts
   * - Event calendars
   * - Safety scores
   * - COVID-19 restrictions
   */
  getPlaceInsight(destination: string): PlaceInsight {
    const insight = findPlaceInsightByDestination(destination);
    
    if (!insight) {
      throw createNotFoundError('Place Insight', destination);
    }

    return insight;
  }

  /**
   * Get all available destinations
   * 
   * @returns List of destinations with place insights
   */
  getAvailableDestinations(): string[] {
    return ['Paris', 'Tokyo', 'Bali', 'New York', 'London', 'Dubai'];
  }
}
