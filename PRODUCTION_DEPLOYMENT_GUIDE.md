TARGET_BACKEND: https://sync-backend-production.up.railway.app
TARGET_FRONTEND: https://sync-application.vercel.app

BUILD_COMMAND_BACKEND: python backend/run_server.py
BUILD_COMMAND_FRONTEND: npm run build && npm start

ENVIRONMENT_VARIABLES:
  REACT_APP_API_URL: https://sync-backend-production.up.railway.app
  MONGODB_URI: [configured in Railway]
  JWT_SECRET: [configured in Railway environment]
  CORS_ORIGINS: https://sync-application.vercel.app

DEPLOYMENT_CHECKLIST:

1. BACKEND DEPLOYMENT (Railway):
   ☑ Ensure MongoDB indexes are created via ensure_indexes()
   ☐ Push latest backend code including:
     - realtime.py router with WebSocket /ws endpoint
     - Updated socket_manager.py with unified emit_event
     - feed_ranking.py service for AI scoring
     - Updated notifications.py helper functions
   ☐ Verify environment variables set:
     - MONGODB_URI
     - JWT_SECRET
     - JWT_ALGORITHM
     - JWT_EXPIRE_MINUTES
   ☐ Trigger Railway redeploy to activate /posts/feed, /posts/create, /notifications/*, /ws endpoints
   ☐ Verify OpenAPI shows all endpoints deployed

2. FRONTEND DEPLOYMENT (Vercel):
   ☑ Build with npm run build
   ☐ Verify env var REACT_APP_API_URL points to production backend
   ☐ Ensure UnifiedFeedComponent uses:
     - useFeedInfiniteScroll hook (caching, pagination)
     - useRealtime hook (WebSocket connection)
     - useInfiniteScroll hook (scroll trigger)
   ☐ Push to Vercel to activate:
     - Infinite scroll + caching
     - Real-time post updates
     - Live notification badge
   ☐ Verify frontend bundle includes new hooks and components

3. FEATURE VERIFICATION:

   Real-Time Notifications:
   ✓ Backend broadcasts via emit_event()
   ✓ Frontend receives via WebSocket /ws
   ✓ Navbar shows unread count badge
   ✓ Test: Create post, verify appears instantly in feed

   WebSocket Live Updates:
   ✓ New posts broadcast to all connected clients
   ✓ Notifications sent on like/comment/connection
   ✓ Messages update in real-time
   ✓ Test: Open feed in 2 tabs, post in one, verify shows in other

   AI-Based Feed Ranking:
   ✓ calculate_feed_score() considers:
     engagement (likes + comments) * 0.4
     recency (newer posts scored higher) * 0.3
     connection_priority (posts from connections) * 0.2
     user_interest (same role/skills) * 0.1
   ✓ sort_by="ranked" enables AI ranking
   ✓ Test: Sort by "Best (AI Ranked)" should show highest engagement posts first

   Infinite Scroll + Caching:
   ✓ useFeedInfiniteScroll caches posts in localStorage
   ✓ Pagination: skip/limit=10 per request
   ✓ IntersectionObserver triggers loadNextPage() when scrolling
   ✓ SkeletonLoader shown while loading
   ✓ Test: Scroll to bottom, verify next 10 posts load automatically

   Performance Improvements:
   ✓ LazyImage defers loading images until visible
   ✓ SkeletonLoader reduces CLS (Cumulative Layout Shift)
   ✓ Debounce on search/filter to reduce API calls
   ✓ Minimize re-renders via useMemo and useCallback
   ✓ Test: Monitor Network tab, verify debouncing works

   Error Handling & Fallback:
   ✓ Failed feed loads fallback to cache
   ✓ WebSocket disconnect triggers automatic reconnect after 3s
   ✓ API errors show toast notification
   ✓ Empty state displays helpful message
   ✓ Test: Turn off network, refresh, verify cache loads; turn network on, see live updates resume

4. FINAL SMOKE TEST:

   Role-Based Access:
   ☐ Student logs in:
     - Sees feed (should not have "Recruiter" feed option)
     - Posts sync across all 3 dashboards (Student/Professional/JobSeeker)
   ☐ Professional logs in:
     - Sees unified feed
   ☐ Job Seeker logs in:
     - Sees unified feed
   ☐ Recruiter logs in:
     - Feed endpoint returns 403 Forbidden (no feed access)
     - Recruiter dashboard displays without feed card

   Real-Time Behavior:
   ☐ Open feed in 2 browser tabs (same user)
   ☐ Create post in tab 1
   ☐ Verify post appears instantly in tab 2 (no refresh)
   ☐ Open Messages
   ☐ Send message from another user
   ☐ Verify it appears in real-time

   Feed Quality:
   ☐ No duplicate posts
   ☐ All 3 dashboards show same posts in same order
   ☐ Media displays correctly (images/videos)
   ☐ Like/comment counts update immediately
   ☐ Sort options work (Recent/Relevant/AI Ranked)

   Notifications:
   ☐ Like a post → notification appears in bell
   ☐ Comment on post → notification sent
   ☐ Connection request → notification sent
   ☐ Unread count badge updates
   ☐ Click notification → marked as read

5. MONITORING & LOGS:

   Backend Logs (Railway):
   - Check for WebSocket connection errors
   - Monitor feed endpoint response times
   - Verify broadcast_post() successfully sends to all clients

   Frontend Console:
   - No "Failed to connect to WebSocket" errors
   - Verify "Live updates enabled" indicator appears
   - Monitor cache hit ratio (should show in network tab)

   Performance Metrics:
   - First Contentful Paint (FCP) < 1.5s
   - Largest Contentful Paint (LCP) < 2.5s
   - Cumulative Layout Shift (CLS) < 0.1
