/**
 * Server Entry Point
 * Starts the Express server
 */

// Register path aliases
import 'tsconfig-paths/register';

import { createApp } from './app';
import { config } from './config';

/**
 * Start the server
 */
function startServer(): void {
  const app = createApp();
  const PORT = config.port;

  const server = app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 ${config.appName}`);
    console.log('='.repeat(50));
    console.log(`📍 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Server running on: http://localhost:${PORT}`);
    console.log(`📚 API Base URL: http://localhost:${PORT}${config.apiPrefix}/${config.apiVersion}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}${config.apiPrefix}/${config.apiVersion}/health`);
    console.log('='.repeat(50));
    console.log('✅ Server started successfully!\n');
  });

  /**
   * Graceful shutdown handling
   */
  const shutdown = (signal: string) => {
    console.log(`\n${signal} signal received: closing HTTP server`);
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forcing server shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  /**
   * Handle unhandled promise rejections
   */
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to restart the server here
  });

  /**
   * Handle uncaught exceptions
   */
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // In production, you should restart the server here
    process.exit(1);
  });
}

/**
 * Start the server if this file is run directly
 */
if (require.main === module) {
  startServer();
}

export { startServer };
