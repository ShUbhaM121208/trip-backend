/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app for Vercel deployment
 */

import { createApp } from '../src/app';
import { Request, Response } from 'express';

// Create the Express app
const app = createApp();

// Export handler for Vercel
export default app;
