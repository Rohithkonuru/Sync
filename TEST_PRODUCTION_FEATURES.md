# Quick Test Commands for Production Features

## Backend Testing

### 1. Verify Python compilation
```bash
cd /Sync
python -m py_compile backend/app/routes/posts.py backend/app/services/feed_ranking.py backend/app/routes/realtime.py backend/app/database.py backend/app/main.py backend/app/services/notifications.py backend/app/services/socket_manager.py
# Expected: No output (success)
```

### 2. Start backend locally
```bash
cd backend
python run_server.py
# Expected: Server running on http://127.0.0.1:8000/
```

### 3. Test WebSocket endpoint (after backend starts)
```bash
# In PowerShell
$token = "YOUR_JWT_TOKEN_HERE"
$wsUrl = "ws://localhost:8000/ws/USER_ID_HERE?token=$token"
echo "Connecting to: $wsUrl"

# Or use wscat if installed:
# npm install -g wscat
# wscat -c $wsUrl
```

### 4. Test feed endpoint with AI ranking
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/posts/feed?sort_by=ranked&limit=10"
# Response should include posts with ai_score field
```

### 5. Test notifications endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/notifications?limit=10&unread_only=false"
# Response should include notification list with is_read flag
```

## Frontend Testing

### 1. Build frontend
```bash
cd frontend
npm run build
# Expected: Build succeeds, new bundle created
```

### 2. Verify environment
```bash
# Check .env or .env.local
echo $REACT_APP_API_URL  # Should be production backend URL
```

### 3. Test UnifiedFeedComponent locally
```bash
# In frontend directory
npm start
# Navigate to http://localhost:3000/home
# Look for:
# - Sort dropdown with "Best (AI Ranked)" option
# - "Live updates enabled" indicator (if WebSocket connected)
# - Infinite scroll on scroll-to-bottom
# - Skeleton loaders when loading
```

### 4. Test infinite scroll
```javascript
// In browser console
// Scroll to bottom of feed
// Should auto-load next 10 posts
// Check Network tab for /api/posts/feed?skip=10&limit=10 request
```

### 5. Test caching
```javascript
// In browser console
localStorage.getItem('feed_data_cache')  // Returns cached posts JSON
localStorage.getItem('feed_cache_timestamp')  // Returns cache time
// Reload page - should show cached posts while real-time data loads
```

### 6. Test real-time updates
```javascript
// Open feed in 2 browser tabs
// Tab 1: Create a post via composer
// Tab 2: Should see new post appear instantly (no page refresh)
// Check Network tab - should NOT see any /posts/feed request on Tab 2
```

## Deployment Testing

### 1. After Railway Backend Redeploy
```bash
# Check OpenAPI schema includes all endpoints
curl https://sync-backend-production.up.railway.app/openapi.json | grep -E "(feed|create|notifications|ws)"

# Expected to see:
# - /posts/feed
# - /posts/create
# - /notifications
# - /notifications/unread/count
# - /notifications/{notification_id}/read
```

### 2. After Vercel Frontend Redeploy
```bash
# Wait for build to complete (~2-3 minutes)
# Navigate to https://sync-application.vercel.app/home

# Expected:
# - Page loads without console errors
# - Feed visible with sort options
# - "Live updates enabled" indicator
# - Infinite scroll works on scroll-to-bottom
```

### 3. End-to-End Real-Time Test
- User A posts on https://sync-application.vercel.app/home
- User B (different browser tab or device) sees post instantly
- No page refresh required
- Like count updates in real-time

### 4. Performance Test
```javascript
// In browser console
performance.getEntriesByType('navigation')[0].loadEventEnd - performance.getEntriesByType('navigation')[0].fetchStart
// Should be < 3000ms for home page load
```

## Rollback Plan

If issues occur during deployment:

### Backend Rollback (Railway)
```bash
# In Railway dashboard:
# 1. Go to Deployments
# 2. Select previous successful deployment (before 21acb47)
# 3. Click "Redeploy"
# Wait for redeploy to complete
```

### Frontend Rollback (Vercel)
```bash
# In Vercel dashboard:
# 1. Go to Deployments
# 2. Find last successful deployment before production upgrade
# 3. Click "Promote to Production"
# Wait for promotion to complete
```

## Monitoring Commands

### Check backend logs (Railway)
```bash
# In Railway console:
# Deployments > [Current] > Logs
# Look for:
# - "WebSocket connected for user"
# - "Notification sent to user"
# - Any ERROR level messages
```

### Check frontend bundle
```bash
# In browser DevTools > Network:
# Check main.*.js bundle size (target: < 500KB)
# Verify no 4xx/5xx responses
# Monitor WebSocket connections (#1)
```

## Success Criteria

✅ All Python files compile
✅ Backend starts without errors
✅ WebSocket endpoint accepts connections
✅ Feed endpoint supports sort_by=ranked
✅ Notifications show real-time updates
✅ Frontend builds successfully
✅ Infinite scroll triggers on bottom
✅ Cache persists across reloads
✅ Real-time posts appear instantly
✅ No duplicate posts in feed
✅ Recruiter gets 403 on feed access
✅ All dashboards show same feed
