/**
 * Application Configuration
 * Centralized configuration management
 */

export const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // API configuration
  apiVersion: 'v1',
  apiPrefix: '/api',

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',

  // Application metadata
  appName: process.env.APP_NAME || 'Trip Companion API',

  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
