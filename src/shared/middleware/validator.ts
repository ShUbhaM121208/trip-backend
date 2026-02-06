/**
 * Request Validation Middleware
 * Uses Zod schemas to validate request data
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { createValidationError } from './errorHandler';

/**
 * Middleware factory to validate request body
 * @param schema - Zod schema for validation
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(createValidationError(message));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory to validate request params
 * @param schema - Zod schema for validation
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(createValidationError(message));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory to validate request query
 * @param schema - Zod schema for validation
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(createValidationError(message));
      } else {
        next(error);
      }
    }
  };
}
