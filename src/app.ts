/**
 * Express Application Setup
 * Configures middleware and routes
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsMiddleware } from './shared/middleware/cors';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';
import routes from './routes';
import { config } from './config';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app: Application = express();

  // ============================================
  // Security & Logging Middleware
  // ============================================

  // Helmet: Set security-related HTTP headers
  app.use(helmet());

  // Morgan: HTTP request logger (only in development)
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  }

  // CORS: Enable Cross-Origin Resource Sharing
  app.use(corsMiddleware);

  // ============================================
  // Body Parsing Middleware
  // ============================================

  // Parse JSON request bodies
  app.use(express.json());

  // Parse URL-encoded request bodies
  app.use(express.urlencoded({ extended: true }));

  // ============================================
  // API Routes
  // ============================================

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Welcome to Trip Companion API',
      version: config.apiVersion,
      documentation: `${config.apiPrefix}/${config.apiVersion}/health`,
    });
  });

  // Register all API routes under /api/v1
  app.use(`${config.apiPrefix}/${config.apiVersion}`, routes);

  // ============================================
  // Error Handling
  // ============================================

  // Handle 404 errors for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
