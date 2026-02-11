/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app for Vercel deployment
 */

// Use relative path instead of alias for Vercel compatibility
import { createApp } from '../dist/app';

// Create the Express app
const app = createApp();

// Export handler for Vercel
export default app;
