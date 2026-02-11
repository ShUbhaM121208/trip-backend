/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app for Vercel deployment
 */

// Register TypeScript path aliases
import 'tsconfig-paths/register';

import { createApp } from '../src/app';

// Create the Express app
const app = createApp();

// Export handler for Vercel
export default app;
