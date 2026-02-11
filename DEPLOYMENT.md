# Vercel Deployment Guide

## Backend Deployment

### Prerequisites
- Vercel account ([signup here](https://vercel.com/signup))
- GitHub repository connected to Vercel

### Deploy to Vercel

1. **Install Vercel CLI** (optional, for CLI deployment)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard** (Recommended)
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository: `ShUbhaM121208/trip-backend`
   - Configure the following settings:
     - **Framework Preset**: Other
     - **Root Directory**: ./
     - **Build Command**: `npm run build`
     - **Output Directory**: dist
     - **Install Command**: `npm install`

3. **Deploy via Vercel CLI**
   ```bash
   cd trip-companion-backend
   vercel --prod
   ```

### Environment Variables
No environment variables needed for the current setup. Add later if needed:
- `NODE_ENV` (automatically set to 'production' by Vercel)
- Add any API keys or secrets in Vercel Dashboard > Project Settings > Environment Variables

### API Endpoints
After deployment, your API will be available at:
```
https://your-backend.vercel.app/api/v1/health
https://your-backend.vercel.app/api/v1/trips
https://your-backend.vercel.app/api/v1/expenses
```

### Notes
- The `api/index.ts` file exports the Express app for serverless deployment
- All API routes are handled through Vercel serverless functions
- Cold starts may occur on first request after inactivity

---

## Frontend Deployment

### Deploy to Vercel

1. **Deploy via Vercel Dashboard** (Recommended)
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository: `ShUbhaM121208/trip-companion-ui`
   - Configure the following settings:
     - **Framework Preset**: Vite
     - **Root Directory**: ./
     - **Build Command**: `npm run build`
     - **Output Directory**: dist
     - **Install Command**: `npm install`

2. **Deploy via Vercel CLI**
   ```bash
   cd trip-companion-ui
   vercel --prod
   ```

### Environment Variables
Add in Vercel Dashboard > Project Settings > Environment Variables:
- `VITE_API_URL`: Your backend URL (e.g., `https://your-backend.vercel.app`)

### Post-Deployment
1. Copy your deployed backend URL
2. Update the `VITE_API_URL` environment variable in Vercel
3. Redeploy the frontend to apply changes

---

## Quick Deploy Commands

### Backend
```bash
cd trip-companion-backend
vercel --prod
```

### Frontend
```bash
cd trip-companion-ui
vercel --prod
```

---

## Troubleshooting

### Backend Issues
- **Error: Cannot find module**: Ensure all dependencies are in `package.json`
- **API routes not working**: Check `vercel.json` routing configuration
- **Build fails**: Verify TypeScript compilation with `npm run build`

### Frontend Issues
- **API calls fail**: Verify `VITE_API_URL` environment variable is set correctly
- **404 errors**: Check `vercel.json` rewrites configuration
- **Build fails**: Ensure all dependencies are installed

---

## Continuous Deployment
Both projects are set up for automatic deployments:
- Every push to `main` branch triggers a production deployment
- Pull requests create preview deployments
- Configure in Vercel Dashboard > Project Settings > Git

---

## Project URLs (After Deployment)
- Backend API: `https://trip-backend-xxxx.vercel.app`
- Frontend App: `https://trip-companion-ui-xxxx.vercel.app`

Replace these with your actual deployment URLs.
