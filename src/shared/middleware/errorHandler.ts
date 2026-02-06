/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error handler middleware
 * Catches all errors and sends appropriate response
 */
export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
      statusCode: 500,
    },
  });
}

/**
 * Not Found handler
 * Handles requests to undefined routes
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${_req.method} ${_req.path} not found`,
      statusCode: 404,
    },
  });
}

/**
 * Helper functions to create common errors
 */
export const createNotFoundError = (resource: string, id?: string): ApiError => {
  const message = id
    ? `${resource} with ID '${id}' not found`
    : `${resource} not found`;
  return new ApiError(404, message);
};

export const createBadRequestError = (message: string): ApiError => {
  return new ApiError(400, message);
};

export const createValidationError = (message: string): ApiError => {
  return new ApiError(422, message);
};
