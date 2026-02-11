/**
 * Vercel Serverless Function Entry Point
 * Exports Express app for Vercel serverless deployment
 */

import { createApp } from '../src/app';

// Create and export the Express app for Vercel
export default createApp();
