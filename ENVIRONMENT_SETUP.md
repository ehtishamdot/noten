# Environment Variables Setup Guide

This guide explains how to configure environment variables for the Note Ninjas frontend to connect to your backend API in different environments.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update the backend URL:**
   ```bash
   # In .env.local, set your backend URL
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Environment Variables Overview

### Required Variables

- `NEXT_PUBLIC_API_URL` - The URL of your backend API server

### Optional Variables

- `NEXT_PUBLIC_FRONTEND_PORT` - Port for the frontend server (defaults to 3000)
- `NODE_ENV` - Environment mode (`development`, `production`, `test`)
- `DEBUG` - Enable debug logging (`true` or `false`)

## Environment-Specific Setup

### 🖥️ Local Development

**File:** `.env.local`

```bash
# Backend running locally on port 8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Frontend on custom port (optional)
NEXT_PUBLIC_FRONTEND_PORT=3002

NODE_ENV=development
DEBUG=true
```

**Common local backend URLs:**
- `http://localhost:8000` - Default FastAPI port
- `http://localhost:8002` - Alternative port
- `http://127.0.0.1:8000` - Using IP instead of localhost

### 🚀 Production Deployment

#### Vercel Deployment

**Method 1: Environment Variables UI**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.com`

**Method 2: Command Line**
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-backend-domain.com
```

#### Netlify Deployment

**Method 1: Environment Variables UI**
1. Go to Site settings → Environment variables
2. Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.com`

**Method 2: netlify.toml**
```toml
[build.environment]
  NEXT_PUBLIC_API_URL = \"https://your-backend-domain.com\"
```

#### Heroku Deployment

```bash
heroku config:set NEXT_PUBLIC_API_URL=https://your-backend-app.herokuapp.com
```

#### Railway Deployment

1. Go to your Railway project
2. Navigate to Variables tab
3. Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app`

### 🐳 Docker Deployment

#### Single Container
```dockerfile
# In your Dockerfile
ENV NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

#### Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - \"3000:3000\"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
      
  backend:
    # your backend service configuration
    ports:
      - \"8000:8000\"
```

**With environment file:**
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - \"3000:3000\"
    env_file:
      - .env.production
```

### 🧪 Testing/Staging

**File:** `.env.staging`

```bash
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com
NODE_ENV=production
DEBUG=false
```

## Backend URL Examples by Hosting Provider

### Backend on Heroku
```bash
NEXT_PUBLIC_API_URL=https://your-app-name.herokuapp.com
```

### Backend on Railway
```bash
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app
```

### Backend on Render
```bash
NEXT_PUBLIC_API_URL=https://your-app-name.onrender.com
```

### Backend on DigitalOcean App Platform
```bash
NEXT_PUBLIC_API_URL=https://your-app-name.ondigitalocean.app
```

### Backend on AWS (ECS/Elastic Beanstalk)
```bash
NEXT_PUBLIC_API_URL=https://your-app-name.region.elasticbeanstalk.com
```

### Backend on Google Cloud Run
```bash
NEXT_PUBLIC_API_URL=https://your-service-name-region-project-id.run.app
```

### Custom Domain
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### ❌ Common Issues

1. **Frontend can't connect to backend**
   - Check that `NEXT_PUBLIC_API_URL` is correct
   - Verify backend is running and accessible
   - Check CORS configuration on backend

2. **Environment variables not loading**
   - Restart your development server after changing `.env.local`
   - Make sure variable names start with `NEXT_PUBLIC_`
   - Check for typos in variable names

3. **CORS errors in browser**
   - Backend must allow your frontend domain in CORS settings
   - Check your backend's `ALLOWED_ORIGINS` configuration

4. **404 errors on API calls**
   - Verify backend API endpoints are correct
   - Check backend is running on the specified URL
   - Ensure no trailing slashes in `NEXT_PUBLIC_API_URL`

### 🔍 Debugging

**Check current configuration:**
```javascript
// Add this to any component to see current config
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

**Test API connection:**
```bash
# Test if backend is accessible
curl https://your-backend-url.com/health
```

**Check environment in browser:**
Open browser dev tools → Console:
```javascript
// This will show all NEXT_PUBLIC_ variables
console.log(process.env);
```

## Security Best Practices

### ✅ Safe for NEXT_PUBLIC_

- API URLs
- Feature flags
- Public configuration
- Non-sensitive settings

### ❌ Never use NEXT_PUBLIC_ for

- API keys or secrets
- Database credentials
- Authentication tokens
- Private configuration

### 🔒 Backend Security

Ensure your backend has proper CORS configuration:

```python
# Example for FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

origins = [
    \"http://localhost:3000\",           # Local dev
    \"https://your-frontend.vercel.app\", # Production
    \"https://yourdomain.com\",          # Custom domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)
```

## Environment Files Priority

Next.js loads environment variables in this order (higher priority overwrites lower):

1. `.env.local` (highest priority, ignored by git)
2. `.env.production` or `.env.development`
3. `.env`
4. Environment variables set by hosting platform

## Commands Reference

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check environment variables
npm run env # (if script exists)

# Test with different environment
NODE_ENV=production npm run build
```

## Need Help?

If you're still having issues:

1. Check that your backend server is running
2. Verify CORS configuration on backend
3. Test API endpoints manually with curl or Postman
4. Check browser network tab for detailed error messages
5. Look at browser console for JavaScript errors

---

**Remember:** Always restart your development server after changing environment variables!