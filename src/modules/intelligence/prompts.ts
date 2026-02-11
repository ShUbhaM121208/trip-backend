/**
 * Prompt Design System
 * Structured prompts for AI assistant interactions
 */

/**
 * Prompt template interface
 */
export interface PromptTemplate<T = unknown> {
  name: string;
  systemPrompt: string;
  contextBuilder: (data: T) => string;
  responseFormatter?: (response: string) => string;
}

/**
 * System prompt - defines the AI assistant's role and personality
 */
export const SYSTEM_PROMPT = `You are an intelligent trip expense assistant helping travelers manage their finances.

Your capabilities:
- Analyze expense patterns and breakdowns
- Provide budget optimization recommendations
- Identify spending trends and anomalies
- Suggest ways to save money
- Calculate settlements between trip participants
- Compare current trip to historical patterns

Your tone:
- Friendly and conversational
- Data-driven but accessible
- Proactive with warnings and suggestions
- Encouraging and supportive

Always:
- Use specific numbers and percentages
- Reference actual trip data
- Provide actionable recommendations
- Explain your reasoning
- Format responses clearly with bullet points and sections`;

/**
 * Expense analysis prompt template
 */
export const EXPENSE_ANALYSIS_TEMPLATE: PromptTemplate<{
  totalExpenses: number;
  categoryBreakdown: Record<string, number>;
  expenseCount: number;
  dateRange?: { start: string; end: string };
  averagePerDay?: number;
}> = {
  name: 'expense_analysis',
  systemPrompt: SYSTEM_PROMPT,
  contextBuilder: (data: { 
    totalExpenses: number;
    categoryBreakdown: Record<string, number>;
    expenseCount: number;
    dateRange?: { start: string; end: string };
    averagePerDay?: number;
  }) => {
    const { totalExpenses, categoryBreakdown, expenseCount, dateRange, averagePerDay } = data;
    
    let context = `Current trip financial data:\n`;
    context += `- Total expenses: $${totalExpenses.toFixed(2)}\n`;
    context += `- Number of expenses: ${expenseCount}\n`;
    
    if (averagePerDay) {
      context += `- Average spending per day: $${averagePerDay.toFixed(2)}\n`;
    }
    
    if (dateRange) {
      context += `- Date range: ${dateRange.start} to ${dateRange.end}\n`;
    }
    
    context += `\nCategory breakdown:\n`;
    Object.entries(categoryBreakdown).forEach(([category, amount]) => {
      const percentage = ((amount / totalExpenses) * 100).toFixed(1);
      context += `- ${category}: $${amount.toFixed(2)} (${percentage}%)\n`;
    });
    
    return context;
  }
};

/**
 * Budget optimization prompt template
 */
export const BUDGET_OPTIMIZATION_TEMPLATE: PromptTemplate<{
  budget: number;
  spent: number;
  remaining: number;
  daysRemaining?: number;
  categoryBreakdown: Record<string, number>;
}> = {
  name: 'budget_optimization',
  systemPrompt: SYSTEM_PROMPT,
  contextBuilder: (data: {
    budget: number;
    spent: number;
    remaining: number;
    daysRemaining?: number;
    categoryBreakdown: Record<string, number>;
  }) => {
    const { budget, spent, remaining, daysRemaining, categoryBreakdown } = data;
    const percentage = ((spent / budget) * 100).toFixed(1);
    
    let context = `Budget status:\n`;
    context += `- Total budget: $${budget.toFixed(2)}\n`;
    context += `- Spent: $${spent.toFixed(2)} (${percentage}%)\n`;
    context += `- Remaining: $${remaining.toFixed(2)}\n`;
    
    if (daysRemaining) {
      context += `- Days remaining: ${daysRemaining}\n`;
      context += `- Recommended daily budget: $${(remaining / daysRemaining).toFixed(2)}\n`;
    }
    
    context += `\nSpending by category:\n`;
    Object.entries(categoryBreakdown).forEach(([category, amount]) => {
      const catPercentage = ((amount / spent) * 100).toFixed(1);
      context += `- ${category}: $${amount.toFixed(2)} (${catPercentage}%)\n`;
    });
    
    return context;
  }
};

/**
 * Historical comparison prompt template
 */
export const HISTORICAL_COMPARISON_TEMPLATE: PromptTemplate<{
  currentTrip: {
    totalSpent: number;
    categoryBreakdown: Record<string, number>;
    duration: number;
  };
  pastTrips: Array<{
    name: string;
    totalSpent: number;
    categoryBreakdown: Record<string, number>;
    duration: number;
  }>;
}> = {
  name: 'historical_comparison',
  systemPrompt: SYSTEM_PROMPT,
  contextBuilder: (data: {
    currentTrip: {
      totalSpent: number;
      categoryBreakdown: Record<string, number>;
      duration: number;
    };
    pastTrips: Array<{
      name: string;
      totalSpent: number;
      categoryBreakdown: Record<string, number>;
      duration: number;
    }>;
  }) => {
    const { currentTrip, pastTrips } = data;
    
    let context = `Current trip:\n`;
    context += `- Total spent: $${currentTrip.totalSpent.toFixed(2)}\n`;
    context += `- Duration: ${currentTrip.duration} days\n`;
    context += `- Daily average: $${(currentTrip.totalSpent / currentTrip.duration).toFixed(2)}\n`;
    
    context += `\nPast trips for comparison:\n`;
    pastTrips.forEach((trip, index) => {
      context += `\nTrip ${index + 1}: ${trip.name}\n`;
      context += `- Total spent: $${trip.totalSpent.toFixed(2)}\n`;
      context += `- Duration: ${trip.duration} days\n`;
      context += `- Daily average: $${(trip.totalSpent / trip.duration).toFixed(2)}\n`;
    });
    
    return context;
  }
};

/**
 * Pattern analysis prompt template
 */
export const PATTERN_ANALYSIS_TEMPLATE: PromptTemplate<{
  patterns: {
    highestSpendingDay: { day: string; amount: number };
    mostCommonCategory: string;
    averageTransactionSize: number;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
  };
}> = {
  name: 'pattern_analysis',
  systemPrompt: SYSTEM_PROMPT,
  contextBuilder: (data: {
    patterns: {
      highestSpendingDay: { day: string; amount: number };
      mostCommonCategory: string;
      averageTransactionSize: number;
      spendingTrend: 'increasing' | 'decreasing' | 'stable';
    };
  }) => {
    const { patterns } = data;
    
    let context = `Spending patterns detected:\n`;
    context += `- Highest spending day: ${patterns.highestSpendingDay.day} ($${patterns.highestSpendingDay.amount.toFixed(2)})\n`;
    context += `- Most common category: ${patterns.mostCommonCategory}\n`;
    context += `- Average transaction: $${patterns.averageTransactionSize.toFixed(2)}\n`;
    context += `- Spending trend: ${patterns.spendingTrend}\n`;
    
    return context;
  }
};

/**
 * Conversation context manager
 * Maintains context window for multi-turn conversations
 */
export class ConversationContext {
  private maxMessages = 10; // Keep last 10 messages for context
  private context: string[] = [];

  /**
   * Add message to context
   */
  addMessage(role: 'user' | 'assistant', content: string): void {
    this.context.push(`${role}: ${content}`);
    
    // Trim to max messages
    if (this.context.length > this.maxMessages) {
      this.context = this.context.slice(-this.maxMessages);
    }
  }

  /**
   * Get conversation context as string
   */
  getContext(): string {
    return this.context.join('\n\n');
  }

  /**
   * Clear context
   */
  clear(): void {
    this.context = [];
  }

  /**
   * Get context window size
   */
  getSize(): number {
    return this.context.length;
  }
}
