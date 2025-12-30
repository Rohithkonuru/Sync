# QA Checklist - End-to-End Testing

## Pre-Testing Setup

- [ ] Run database migrations: `python backend/migrate_database.py`
- [ ] Start backend server: `cd backend && python run_server.py`
- [ ] Start frontend: `cd frontend && npm start`
- [ ] Create test accounts (Recruiter, Job Seeker, Professional, Student)

---

## 1. Job Application Flow

### 1.1 Create Job (Recruiter)
- [ ] Login as recruiter
- [ ] Navigate to Recruiter Dashboard
- [ ] Click "Post New Job"
- [ ] Fill all required fields
- [ ] Submit job
- [ ] Verify job appears in "Active Job Postings"
- [ ] Verify job appears in public jobs list

### 1.2 Apply for Job (Job Seeker)
- [ ] Login as job seeker
- [ ] Navigate to Jobs page
- [ ] Find the test job
- [ ] Click "Apply Now"
- [ ] **Enhanced Form Test:**
  - [ ] Fill full_name (required)
  - [ ] Fill email (required)
  - [ ] Fill contact_number
  - [ ] Fill address
  - [ ] Fill cover_letter (required)
  - [ ] Upload resume file (PDF/DOC)
  - [ ] Verify file preview shows
  - [ ] Verify upload progress indicator
  - [ ] Add skills (multiple)
  - [ ] Fill experience_years
  - [ ] Fill portfolio_url
  - [ ] Submit application
- [ ] Verify success message
- [ ] Verify application appears in "My Applications"

### 1.3 View Applications (Recruiter)
- [ ] Login as recruiter
- [ ] Navigate to Recruiter Dashboard
- [ ] Click "View Applications" on job
- [ ] **Verify applications load correctly:**
  - [ ] Applications list displays
  - [ ] Applicant name shows
  - [ ] Applicant email shows
  - [ ] Application status shows
  - [ ] Applied date shows
  - [ ] Resume download button visible (if resume uploaded)
- [ ] Click "View Details" on an application
- [ ] **Verify application details:**
  - [ ] Full name displayed
  - [ ] Email displayed
  - [ ] Contact number displayed
  - [ ] Address displayed
  - [ ] Cover letter displayed
  - [ ] Skills displayed
  - [ ] Experience years displayed
  - [ ] Portfolio URL displayed (if provided)
  - [ ] Resume download works
  - [ ] Status history shows

### 1.4 Download Resume (Recruiter)
- [ ] From application details, click "Download Resume"
- [ ] Verify file downloads
- [ ] Verify file is correct format (PDF/DOC)
- [ ] Verify file content is correct

### 1.5 Update Application Status (Recruiter)
- [ ] From application details, select new status
- [ ] Add optional note
- [ ] Click "Update Status"
- [ ] Verify success message
- [ ] Verify status updated in UI
- [ ] Verify status history entry added
- [ ] **Check notification:**
  - [ ] Applicant receives notification (if WebSocket enabled)
  - [ ] Notification appears in applicant's notification dropdown

### 1.6 Delete Application
- [ ] As recruiter, click delete on application
- [ ] Confirm deletion
- [ ] Verify application removed from list
- [ ] As applicant, verify can delete own application
- [ ] Verify proper error if unauthorized user tries to delete

---

## 2. Candidate Search (Recruiter)

### 2.1 Search Candidates
- [ ] Login as recruiter
- [ ] Navigate to Recruiter Dashboard
- [ ] Click "Search Candidates"
- [ ] **Test filters:**
  - [ ] Search by name
  - [ ] Filter by location
  - [ ] Filter by skills (comma-separated)
  - [ ] Filter by user_type
  - [ ] Filter by experience_years_min
  - [ ] Filter by experience_years_max
  - [ ] Combine multiple filters
- [ ] Verify results display correctly
- [ ] Verify pagination works (if > 20 results)
- [ ] Click "View Profile" on candidate
- [ ] Verify profile page loads

---

## 3. Connections System

### 3.1 Send Connection Request
- [ ] Login as user A
- [ ] Navigate to user B's profile
- [ ] Click "Connect"
- [ ] Verify request sent
- [ ] Verify notification sent to user B

### 3.2 Accept Connection Request
- [ ] Login as user B
- [ ] Navigate to "My Connections"
- [ ] Go to "Requests" tab
- [ ] Verify pending request appears
- [ ] Click "Accept"
- [ ] Verify success message
- [ ] Verify connection appears in "Connections" tab
- [ ] Verify notification sent to user A

### 3.3 Reject Connection Request
- [ ] As user B, click "Reject" on pending request
- [ ] Verify request removed
- [ ] Verify no connection created

### 3.4 Remove Connection
- [ ] Navigate to "My Connections"
- [ ] Find a connection
- [ ] Click remove/unfriend button
- [ ] Confirm removal
- [ ] Verify connection removed from both users

---

## 4. Notifications System

### 4.1 Notification Bubble
- [ ] Verify unread count displays in navbar
- [ ] Verify count updates in real-time (WebSocket)
- [ ] Click notification bell
- [ ] Verify dropdown opens
- [ ] Verify notifications list displays
- [ ] Verify unread notifications highlighted

### 4.2 Mark as Read
- [ ] Click on unread notification
- [ ] Verify notification marked as read
- [ ] Verify unread count decreases
- [ ] Click "Mark All as Read"
- [ ] Verify all notifications marked as read
- [ ] Verify unread count = 0

### 4.3 Real-time Notifications
- [ ] Open two browser windows (User A and User B)
- [ ] User B applies for User A's job
- [ ] Verify User A receives notification immediately (WebSocket)
- [ ] Verify notification appears in dropdown
- [ ] Verify unread count increases

### 4.4 Notification Types
- [ ] Job application notification
- [ ] Application status update notification
- [ ] Connection request notification
- [ ] Connection accepted notification
- [ ] Message notification (if implemented)

---

## 5. Error Handling

### 5.1 Validation Errors
- [ ] Submit application without required fields
- [ ] Verify field-specific error messages
- [ ] Submit invalid email format
- [ ] Verify email validation error
- [ ] Upload invalid file type
- [ ] Verify file type error
- [ ] Upload file > 5MB
- [ ] Verify file size error

### 5.2 Permission Errors
- [ ] Try to view applications for job you didn't post (403)
- [ ] Try to update status as non-recruiter (403)
- [ ] Try to delete application as unauthorized user (403)
- [ ] Verify clear error messages

### 5.3 Not Found Errors
- [ ] Access non-existent job (404)
- [ ] Access non-existent application (404)
- [ ] Download resume for application without resume (404)
- [ ] Verify clear error messages

### 5.4 Network Errors
- [ ] Disconnect internet
- [ ] Try to submit application
- [ ] Verify error message displayed
- [ ] Reconnect internet
- [ ] Verify retry works

---

## 6. UI/UX Testing

### 6.1 Loading States
- [ ] Verify loading spinner on application submission
- [ ] Verify loading state on resume upload
- [ ] Verify loading state when fetching applications
- [ ] Verify loading state on status update

### 6.2 Success States
- [ ] Verify success toast on application submission
- [ ] Verify success toast on status update
- [ ] Verify success toast on connection actions
- [ ] Verify success messages are clear

### 6.3 Form Validation
- [ ] Verify real-time validation (as user types)
- [ ] Verify error messages clear when fixed
- [ ] Verify submit button disabled when form invalid
- [ ] Verify required fields marked with *

### 6.4 Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify forms are usable on all sizes
- [ ] Verify modals are scrollable on mobile

---

## 7. Performance Testing

### 7.1 Large Data Sets
- [ ] Create 100+ applications for a job
- [ ] Verify applications list loads efficiently
- [ ] Verify pagination works
- [ ] Verify search/filter performance

### 7.2 File Upload
- [ ] Upload 1MB resume
- [ ] Upload 5MB resume (max size)
- [ ] Verify upload progress indicator
- [ ] Verify upload completes successfully

---

## 8. Integration Testing

### 8.1 End-to-End Flow
- [ ] **Complete flow:**
  1. Recruiter creates job
  2. Job seeker applies with resume
  3. Recruiter views application
  4. Recruiter downloads resume
  5. Recruiter updates status to "shortlisted"
  6. Applicant receives notification
  7. Applicant views updated status
  8. Recruiter updates to "accepted"
  9. Applicant receives notification

### 8.2 Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## 9. Security Testing

### 9.1 Authorization
- [ ] Verify JWT token required for all endpoints
- [ ] Verify expired tokens rejected
- [ ] Verify invalid tokens rejected
- [ ] Verify users can only access their own data

### 9.2 File Upload Security
- [ ] Try to upload executable file (.exe)
- [ ] Verify rejected
- [ ] Try to upload very large file (>5MB)
- [ ] Verify rejected
- [ ] Verify uploaded files stored securely

---

## 10. Database Verification

### 10.1 Data Integrity
- [ ] Verify application saved with all fields
- [ ] Verify status_history array populated
- [ ] Verify resume_file_url saved correctly
- [ ] Verify custom_fields saved as JSON

### 10.2 Indexes
- [ ] Verify queries use indexes (check MongoDB logs)
- [ ] Verify search performance is acceptable

---

## Test Results Template

```
Date: __________
Tester: __________
Environment: Development / Staging / Production

Feature: Job Applications
Status: ✅ Pass / ❌ Fail / ⚠️ Partial
Notes: __________

Feature: Candidate Search
Status: ✅ Pass / ❌ Fail / ⚠️ Partial
Notes: __________

Feature: Connections
Status: ✅ Pass / ❌ Fail / ⚠️ Partial
Notes: __________

Feature: Notifications
Status: ✅ Pass / ❌ Fail / ⚠️ Partial
Notes: __________

Critical Issues Found: __________
Minor Issues Found: __________
```

---

## Known Issues / Limitations

- List any known issues here
- Document workarounds if needed

---

## Sign-off

- [ ] All critical features tested
- [ ] All critical bugs fixed
- [ ] Documentation updated
- [ ] Ready for production

**Tester Signature:** __________
**Date:** __________

