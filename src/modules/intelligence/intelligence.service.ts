/**
 * Intelligence Service
 * Business logic for AI assistant (mock implementation)
 */

import type { ChatMessage, ChatMessageDto } from '@/shared/types';
import { chatHistory, findTripById, expenses } from '@/shared/data/mockDataStore';
import { generateMessageId } from '@/shared/utils/id.util';
import { getCurrentTimestamp } from '@/shared/utils/date.util';
import { createNotFoundError } from '@/shared/middleware/errorHandler';

/**
 * Service class handling AI assistant business logic
 */
export class IntelligenceService {
  /**
   * Process chat message and generate AI response
   */
  async processMessage(dto: ChatMessageDto): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    // Validate trip if tripId provided
    if (dto.tripId) {
      const trip = findTripById(dto.tripId);
      if (!trip) {
        throw createNotFoundError('Trip', dto.tripId);
      }
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: dto.content,
      timestamp: getCurrentTimestamp(),
    };

    // Generate AI response (mock implementation)
    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: this.generateMockResponse(dto.content, dto.tripId),
      timestamp: getCurrentTimestamp(),
    };

    // Store in chat history
    const chatKey = dto.tripId || 'global';
    const history = chatHistory.get(chatKey) || [];
    history.push(userMessage, assistantMessage);
    chatHistory.set(chatKey, history);

    return { userMessage, assistantMessage };
  }

  /**
   * Get chat history for a trip or global
   */
  getChatHistory(tripId?: string): ChatMessage[] {
    const chatKey = tripId || 'global';
    return chatHistory.get(chatKey) || [];
  }

  /**
   * Clear chat history
   */
  clearChatHistory(tripId?: string): void {
    const chatKey = tripId || 'global';
    chatHistory.delete(chatKey);
  }

  /**
   * Generate mock AI response based on user input
   */
  private generateMockResponse(userInput: string, tripId?: string): string {
    const input = userInput.toLowerCase();

    // Expense-related queries
    if (input.includes('expense') || input.includes('spending') || input.includes('spent')) {
      if (tripId) {
        return this.generateExpenseSummary(tripId);
      }
      return 'I can help you analyze expenses! Please specify a trip ID to get detailed expense information.';
    }

    // Budget-related queries
    if (input.includes('budget') || input.includes('remaining')) {
      if (tripId) {
        return this.generateBudgetSummary(tripId);
      }
      return 'I can help you track your budget! Please specify a trip ID for budget details.';
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
}
