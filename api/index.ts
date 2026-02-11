/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app for Vercel deployment
 */

// Register TypeScript path aliases with explicit config
import * as path from 'path';
import { register } from 'tsconfig-paths';

// Register paths relative to project root
const baseUrl = path.resolve(__dirname, '..');
register({
  baseUrl,
  paths: {
    '@/*': ['src/*']
  }
});

import { createApp } from '../src/app';

// Create the Express app
const app = createApp();

// Export handler for Vercel
export default app;
