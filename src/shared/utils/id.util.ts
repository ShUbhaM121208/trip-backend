/**
 * ID Generation Utility
 * Creates unique identifiers for entities
 */

let counter = 0;

/**
 * Generate a unique ID with prefix
 * @param prefix - Prefix for the ID (e.g., 't' for trip, 'e' for expense)
 * @returns Unique ID string
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now();
  counter = (counter + 1) % 1000;
  return prefix ? `${prefix}${timestamp}${counter}` : `${timestamp}${counter}`;
}

/**
 * Generate user ID
 */
export function generateUserId(): string {
  return generateId('u');
}

/**
 * Generate trip ID
 */
export function generateTripId(): string {
  return generateId('t');
}

/**
 * Generate expense ID
 */
export function generateExpenseId(): string {
  return generateId('e');
}

/**
 * Generate ticket ID
 */
export function generateTicketId(): string {
  return generateId('ticket-');
}

/**
 * Generate message ID
 */
export function generateMessageId(): string {
  return generateId('msg-');
}
