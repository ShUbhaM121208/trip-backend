/**
 * Express Type Helpers
 * Utility types for Express request handling
 */

import { Request } from 'express';

/**
 * Helper to safely extract string param from Express request
 */
export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Helper to safely extract query parameter
 */
export function getQuery(req: Request, key: string): string | undefined {
  const value = req.query[key];
  if (Array.isArray(value)) return value[0] as string;
  return value as string | undefined;
}
