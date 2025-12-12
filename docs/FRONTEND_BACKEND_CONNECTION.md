# 🔗 Frontend-Backend Connection Guide

## Problem: Frontend Using Mock Data Instead of Real Backend

The frontend was configured with localhost fallbacks and mock data, preventing it from connecting to the production backend.

## ✅ Solution Applied

### 1. Centralized API Configuration

All API URLs now use the centralized configuration from `src/config/api.ts`:

```typescript
// src/config/api.ts
export const API_URL = import.meta.env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';
```

### 2. Fixed Files

The following files were updated to use the centralized API configuration:

- ✅ `src/services/config.ts` - Removed localhost fallback, uses production default
- ✅ `src/services/api-client.ts` - Removed localhost fallback, uses production default  
- ✅ `src/hooks/useDashboardData.ts` - Now imports from centralized config
- ✅ `src/hooks/useMarketData.ts` - Now imports from centralized config

### 3. Environment Variable Configuration

**CRITICAL:** Set `VITE_API_URL` in your deployment environment.

## 🚀 Deployment Configuration

### For Netlify (Frontend)

1. Go to **Netlify Dashboard** → Your Site → **Site settings** → **Environment variables**

2. Add the following variables:

```bash
VITE_API_URL=https://your-backend.up.railway.app
VITE_WS_URL=wss://your-backend.up.railway.app
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
```

3. **Redeploy** your site after adding variables

### For Railway (Backend)

1. Go to **Railway Dashboard** → Your Service → **Variables**

2. Ensure these are set:

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend.netlify.app
BACKEND_URL=https://your-backend.up.railway.app
```

3. **Important:** Update CORS in `src/backend/server.ts` to allow your frontend domain

### For Local Development

Create `.env.local` in the project root:

```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=your-dev-project-id
```

## 🔍 Verification Steps

### 1. Check Environment Variables

In your browser console (on deployed frontend):

```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

Should show your production backend URL, not localhost.

### 2. Test API Connection

Open browser DevTools → Network tab:

1. Load your frontend
2. Look for API requests to your backend URL
3. Verify they're going to production URL, not localhost

### 3. Check API Responses

In browser console:

```javascript
fetch(import.meta.env.VITE_API_URL + '/health')
  .then(r => r.json())
  .then(console.log);
```

Should return `{ status: 'ok' }` from your backend.

## 🐛 Troubleshooting

### Frontend Still Using Localhost

**Problem:** Frontend still connecting to localhost:3001

**Solution:**
1. Verify `VITE_API_URL` is set in Netlify environment variables
2. Clear browser cache and hard refresh (Ctrl+Shift+R)
3. Check build logs - environment variables must be set BEFORE build
4. Rebuild and redeploy frontend

### CORS Errors

**Problem:** Browser shows CORS errors when connecting to backend

**Solution:**
1. Update backend CORS configuration in `src/backend/server.ts`:

```typescript
const allowedOrigins = [
  'https://your-frontend.netlify.app',
  'https://your-custom-domain.com',
  // Add your frontend URLs here
];
```

2. Restart backend service
3. Verify CORS headers in Network tab

### API Requests Failing

**Problem:** API requests return 404 or 500 errors

**Solution:**
1. Verify backend is running: `curl https://your-backend.up.railway.app/health`
2. Check backend logs in Railway dashboard
3. Verify API endpoints exist in backend routes
4. Check authentication tokens are being sent

### Mock Data Still Showing

**Problem:** Frontend still shows mock/placeholder data

**Solution:**
1. Check browser console for API errors
2. Verify API endpoints are returning data
3. Check Network tab - are requests succeeding?
4. Some components may have fallback mock data - check component code

## 📋 Pre-Deployment Checklist

- [ ] `VITE_API_URL` set in Netlify environment variables
- [ ] `VITE_WS_URL` set in Netlify environment variables  
- [ ] Backend CORS configured for frontend domain
- [ ] Backend health check endpoint working
- [ ] Frontend rebuilt after setting environment variables
- [ ] Tested API connection in browser console
- [ ] Verified no localhost references in production build

## 🔄 Migration from Mock Data

If you find components still using mock data:

1. **Find the component** using mock data
2. **Replace mock data** with API call using:
   - `api` from `src/services/enhanced-api-client.ts`
   - `API_ENDPOINTS` from `src/config/api.ts`
   - `useQuery` from `@tanstack/react-query` for data fetching

Example:

```typescript
// Before (mock data)
const [data, setData] = useState(mockData);

// After (real API)
const { data } = useQuery({
  queryKey: ['myData'],
  queryFn: () => api.get('/api/my-endpoint'),
});
```

## 📚 Related Files

- `src/config/api.ts` - Centralized API configuration
- `src/services/enhanced-api-client.ts` - Enhanced API client with retry/cache
- `src/services/api-client.ts` - Legacy API client (backward compatible)
- `src/services/config.ts` - Service endpoint configuration

## ✅ Status

- ✅ API URL configuration centralized
- ✅ Localhost fallbacks removed
- ✅ Production defaults configured
- ⚠️ **Action Required:** Set `VITE_API_URL` in deployment environment

---

**Last Updated:** December 2025  
**Status:** ✅ Configuration Fixed - Ready for Deployment

