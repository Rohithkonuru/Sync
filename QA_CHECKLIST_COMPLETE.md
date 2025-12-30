# Complete QA Checklist

This checklist covers all new features and improvements implemented.

## Prerequisites

- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] MongoDB database connected
- [ ] Database migrations run successfully
- [ ] WebSocket server running (for real-time features)
- [ ] Test users created (Student, Recruiter, Professional, Job Seeker)

---

## 1. Application Status Visibility

### 1.1 Applicant View

- [ ] Navigate to `/applications` as a Student/Job Seeker
- [ ] See list of all submitted applications
- [ ] Each application shows:
  - [ ] Job title and company name
  - [ ] Current status with colored badge
  - [ ] Applied date
  - [ ] Latest status update
- [ ] Click "View Details" opens modal with:
  - [ ] Full application information
  - [ ] Status history timeline
  - [ ] Cover letter
  - [ ] Resume link (if uploaded)
  - [ ] Skills and experience

### 1.2 Status History Timeline

- [ ] Status history shows in chronological order (newest first)
- [ ] Each history entry shows:
  - [ ] Status name
  - [ ] Timestamp (relative time)
  - [ ] Optional note
- [ ] Timeline has visual indicators (dots, lines)
- [ ] Current status is highlighted

### 1.3 Real-time Updates

- [ ] As applicant, open `/applications` page
- [ ] As recruiter, update application status
- [ ] Applicant sees:
  - [ ] Status update immediately (WebSocket)
  - [ ] Visual highlight/flash animation
  - [ ] Toast notification
  - [ ] Status badge updates
  - [ ] Status history updates

### 1.4 API Endpoints

- [ ] `GET /api/jobs/my-applications/list` returns applications
- [ ] Response includes `status_history` array
- [ ] Response includes enriched `job` object
- [ ] Pagination works (`skip`, `limit`)
- [ ] `GET /api/jobs/applications/{id}` returns single application
- [ ] Authorization: Only applicant or job poster can view

---

## 2. Connections System

### 2.1 Connection Requests

- [ ] Send connection request to another user
- [ ] Request appears in recipient's "Requests" tab
- [ ] Recipient sees Accept and Decline buttons
- [ ] Accepting request:
  - [ ] Both users added to each other's connections
  - [ ] Request removed from pending list
  - [ ] Notification sent to requester
  - [ ] Optimistic UI update
  - [ ] Undo button available for 5 seconds
- [ ] Declining request:
  - [ ] Request removed from pending list
  - [ ] Optimistic UI update
  - [ ] Undo button available for 5 seconds

### 2.2 Cancel Request

- [ ] User can cancel a request they sent
- [ ] `DELETE /api/users/{user_id}/cancel-request` works
- [ ] Request removed from recipient's pending list
- [ ] No notification sent

### 2.3 My Connections Page

- [ ] Navigate to `/connections`
- [ ] See two tabs: "Connections" and "Requests"
- [ ] Connections tab shows:
  - [ ] Grid/list of connected users
  - [ ] Profile picture, name, headline
  - [ ] Location and skills
  - [ ] "View Profile" button
  - [ ] "Message" button
  - [ ] Remove/unfriend button
- [ ] Requests tab shows:
  - [ ] List of pending requests
  - [ ] Accept/Decline buttons
  - [ ] User information

### 2.4 Remove Connection

- [ ] Click remove/unfriend on a connection
- [ ] Confirmation dialog appears
- [ ] On confirm:
  - [ ] Connection removed from both users
  - [ ] Optimistic UI update
  - [ ] Undo button available for 5 seconds
  - [ ] Success toast notification

### 2.5 API Endpoints

- [ ] `POST /api/users/{id}/connect` - Send request
- [ ] `POST /api/users/{id}/accept` - Accept request
- [ ] `POST /api/users/{id}/reject` - Reject request
- [ ] `POST /api/users/{id}/decline` - Decline request (alias)
- [ ] `DELETE /api/users/{id}/cancel-request` - Cancel sent request
- [ ] `DELETE /api/users/connections/{id}` - Remove connection
- [ ] `GET /api/users/connections/list` - List connections (pagination)
- [ ] `GET /api/users/connection-requests/list` - List pending requests

---

## 3. Feed Improvements

### 3.1 Feed Endpoint

- [ ] `GET /api/posts/feed` returns personalized feed
- [ ] Feed includes posts from connections
- [ ] Feed includes recommended posts (if enabled)
- [ ] Pagination works (`skip`, `limit`)

### 3.2 Feed Sorting

- [ ] `sort_by=recent` sorts by created_at (newest first)
- [ ] `sort_by=relevance` sorts by engagement score
- [ ] Relevance score considers:
  - [ ] Likes (×2)
  - [ ] Comments (×1)
  - [ ] Shares (×3)
  - [ ] Recency factor (decays over 10 days)
  - [ ] Connection boost (+5 for connections)

### 3.3 Recommended Posts

- [ ] `include_recommended=true` includes non-connection posts
- [ ] Only posts with ≥5 engagements shown
- [ ] `include_recommended=false` excludes recommended
- [ ] Recommended posts have lower priority than connection posts

### 3.4 Save Posts

- [ ] Click save button on a post
- [ ] Post saved to user's saved posts
- [ ] Save button shows saved state
- [ ] `GET /api/posts/saved/list` returns saved posts
- [ ] Click save again unsaves the post
- [ ] Saved posts persist across sessions

### 3.5 Feed UI

- [ ] Feed displays posts in cards
- [ ] Each post shows:
  - [ ] User name and picture
  - [ ] Post content
  - [ ] Images (if any)
  - [ ] Like, comment, share, save buttons
  - [ ] Like count, comment count
  - [ ] Timestamp
- [ ] Infinite scroll works (load more on scroll)
- [ ] Loading states shown during fetch

---

## 4. Notifications

### 4.1 Notification Bubble

- [ ] Navbar shows notification bell icon
- [ ] Unread count badge appears when count > 0
- [ ] Badge shows number (or "9+" if > 9)
- [ ] Click bell opens dropdown

### 4.2 Notification Dropdown

- [ ] Shows last 10 notifications
- [ ] Unread notifications highlighted
- [ ] Each notification shows:
  - [ ] Title
  - [ ] Message
  - [ ] Timestamp
- [ ] Click notification:
  - [ ] Marks as read
  - [ ] Navigates to related item (if link exists)

### 4.3 Real-time Notifications

- [ ] WebSocket connection established on login
- [ ] New notification appears immediately
- [ ] Unread count updates in real-time
- [ ] Notification toast appears
- [ ] Fallback to polling if WebSocket unavailable

### 4.4 Notification Types

- [ ] `application_status_update` - Status changed
- [ ] `connection_request` - New request
- [ ] `connection_accepted` - Request accepted
- [ ] `job_application` - New application
- [ ] `like` - Post liked
- [ ] `comment` - Post commented
- [ ] `message` - New message

### 4.5 API Endpoints

- [ ] `GET /api/notifications` - List notifications
- [ ] `GET /api/notifications/unread/count` - Unread count
- [ ] `PUT /api/notifications/{id}/read` - Mark as read
- [ ] `PUT /api/notifications/read-all` - Mark all as read

---

## 5. UI Components

### 5.1 Design Consistency

- [ ] Colors match design tokens
- [ ] Status badges use correct colors
- [ ] Typography consistent
- [ ] Spacing follows design system
- [ ] Buttons have consistent styling

### 5.2 Responsive Design

- [ ] Mobile view (< 768px) works
- [ ] Tablet view (768px - 1024px) works
- [ ] Desktop view (> 1024px) works
- [ ] Navigation adapts to screen size
- [ ] Cards stack on mobile

### 5.3 Accessibility

- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Screen reader friendly

### 5.4 Loading States

- [ ] Loading spinners during data fetch
- [ ] Skeleton loaders for lists
- [ ] Disabled states on buttons
- [ ] Error states with retry

---

## 6. Security & Authorization

### 6.1 Application Access

- [ ] Applicants can only view their own applications
- [ ] Recruiters can only view applications for their jobs
- [ ] Unauthorized access returns 403
- [ ] Resume downloads restricted to applicant/poster

### 6.2 Connection Actions

- [ ] Users can only accept requests sent to them
- [ ] Users can only cancel requests they sent
- [ ] Users cannot connect to themselves
- [ ] Duplicate requests prevented

### 6.3 Feed Access

- [ ] Users see only their connections' posts
- [ ] Saved posts are private
- [ ] Recommended posts filtered by engagement

### 6.4 File Uploads

- [ ] Resume file type validated (PDF, DOC, DOCX)
- [ ] File size limited (5MB)
- [ ] Files stored securely
- [ ] File access restricted

---

## 7. Database Migrations

### 7.1 Migration Execution

- [ ] Run `python backend/migrate_database.py`
- [ ] All migrations complete successfully
- [ ] No errors in migration log

### 7.2 Data Integrity

- [ ] Existing applications have status_history
- [ ] Users have saved_posts array
- [ ] Experience_years calculated correctly
- [ ] Indexes created successfully

### 7.3 Index Verification

- [ ] Check indexes in MongoDB:
  - [ ] `job_applications`: (job_id, status), (applicant_id, status)
  - [ ] `users`: (saved_posts), (connections), (connection_requests)
  - [ ] `posts`: (user_id, created_at), (likes, comments, shares)
  - [ ] `notifications`: (user_id, read, created_at)

---

## 8. Integration Tests

### 8.1 Run Tests

- [ ] `pytest backend/tests/test_job_applications.py -v`
- [ ] `pytest backend/tests/test_connections_feed.py -v`
- [ ] All tests pass

### 8.2 Test Coverage

- [ ] Application submission with resume
- [ ] Status update flow
- [ ] Connection request flow
- [ ] Feed relevance ranking
- [ ] Save/unsave posts
- [ ] Notification delivery

---

## 9. Performance

### 9.1 Response Times

- [ ] Feed loads in < 2 seconds
- [ ] Applications list loads in < 1 second
- [ ] Connections list loads in < 1 second
- [ ] Real-time updates appear in < 500ms

### 9.2 Pagination

- [ ] Large lists paginated correctly
- [ ] Infinite scroll works smoothly
- [ ] No memory leaks on scroll

### 9.3 Database Queries

- [ ] Queries use indexes
- [ ] No N+1 query problems
- [ ] Aggregations optimized

---

## 10. Error Handling

### 10.1 API Errors

- [ ] 400 errors show validation messages
- [ ] 403 errors show authorization messages
- [ ] 404 errors show not found messages
- [ ] 500 errors show generic error (not stack trace)

### 10.2 Frontend Errors

- [ ] Network errors show retry option
- [ ] Validation errors show inline messages
- [ ] Toast notifications for errors
- [ ] Error boundaries catch React errors

### 10.3 WebSocket Errors

- [ ] Connection failures handled gracefully
- [ ] Fallback to polling on disconnect
- [ ] Reconnection attempts
- [ ] Error messages shown to user

---

## 11. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 12. Documentation

- [ ] `FEATURE_IMPLEMENTATION_GUIDE.md` complete
- [ ] `API_EXAMPLES.md` updated with new endpoints
- [ ] `database_migrations_complete.md` accurate
- [ ] Code comments explain complex logic
- [ ] README updated

---

## Sign-off

- [ ] All critical tests pass
- [ ] No blocking bugs
- [ ] Performance acceptable
- [ ] Security review complete
- [ ] Documentation complete

**Tester Name:** _________________  
**Date:** _________________  
**Status:** ☐ Pass  ☐ Fail  ☐ Needs Work

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

