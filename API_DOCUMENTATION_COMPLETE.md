# Complete API Documentation

This document provides comprehensive API documentation for all endpoints, including new features for applications, messaging, connections, and notifications.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All endpoints (except auth endpoints) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Applications Endpoints

### Get My Applications

Get all applications submitted by the current user.

**Endpoint:** `GET /jobs/my-applications/list`

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Maximum number of records (default: 20, max: 100)

**Response:**
```json
[
  {
    "id": "application_id",
    "job_id": "job_id",
    "applicant_id": "user_id",
    "status": "submitted",
    "full_name": "John Doe",
    "email": "john@example.com",
    "contact_number": "+1234567890",
    "address": "123 Main St",
    "cover_letter": "Cover letter text...",
    "portfolio_url": "https://portfolio.com",
    "skills": ["React", "Python"],
    "experience_years": 5,
    "resume_file_url": "/uploads/resumes/file.pdf",
    "status_history": [
      {
        "status": "submitted",
        "updated_at": "2024-01-01T00:00:00Z",
        "updated_by": "user_id",
        "note": "Application received"
      }
    ],
    "applied_at": "2024-01-01T00:00:00Z",
    "job": {
      "id": "job_id",
      "title": "Software Engineer",
      "company_name": "Tech Corp",
      "location": "San Francisco, CA"
    }
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/jobs/my-applications/list?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Application History

Get the status history for a specific application.

**Endpoint:** `GET /jobs/applications/{application_id}/history`

**Response:**
```json
{
  "history": [
    {
      "status": "submitted",
      "updated_at": "2024-01-01T00:00:00Z",
      "updated_by": {
        "id": "user_id",
        "name": "Recruiter Name"
      },
      "note": "Application received and under review"
    },
    {
      "status": "seen",
      "updated_at": "2024-01-02T00:00:00Z",
      "updated_by": {
        "id": "user_id",
        "name": "Recruiter Name"
      },
      "note": null
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/jobs/applications/APPLICATION_ID/history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Download Resume

Download the resume file for an application.

**Endpoint:** `GET /jobs/applications/{application_id}/resume`

**Response:** File download (PDF/DOC)

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/jobs/applications/APPLICATION_ID/resume" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output resume.pdf
```

---

## Messaging Endpoints

### Create or Get Conversation

Create or retrieve a conversation with a user (requires connection).

**Endpoint:** `POST /messages/conversations`

**Query Parameters:**
- `receiver_id` (string, required): ID of the user to message

**Response:**
```json
{
  "user_id": "user_id",
  "user_name": "John Doe",
  "user_picture": "https://example.com/avatar.jpg",
  "last_message": {
    "id": "message_id",
    "content": "Hello!",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "unread_count": 2,
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/messages/conversations?receiver_id=USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Conversations

Get all conversations for the current user (only with connected users).

**Endpoint:** `GET /messages`

**Response:**
```json
[
  {
    "user_id": "user_id",
    "user_name": "John Doe",
    "user_picture": "https://example.com/avatar.jpg",
    "last_message": {
      "id": "message_id",
      "content": "Hello!",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "unread_count": 2,
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/messages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Conversation Messages

Get messages in a conversation with a specific user.

**Endpoint:** `GET /messages/{user_id}`

**Query Parameters:**
- `skip` (int, optional): Number of messages to skip (default: 0)
- `limit` (int, optional): Maximum number of messages (default: 50, max: 100)

**Response:**
```json
[
  {
    "id": "message_id",
    "sender_id": "user_id",
    "receiver_id": "user_id",
    "content": "Hello!",
    "message_type": "text",
    "read": true,
    "read_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/messages/USER_ID?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Send Message

Send a message to a connected user.

**Endpoint:** `POST /messages`

**Request Body:**
```json
{
  "receiver_id": "user_id",
  "content": "Hello!",
  "message_type": "text"
}
```

**Response:**
```json
{
  "id": "message_id",
  "sender_id": "user_id",
  "receiver_id": "user_id",
  "content": "Hello!",
  "message_type": "text",
  "read": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": "USER_ID",
    "content": "Hello!",
    "message_type": "text"
  }'
```

---

### Share Post to Message

Share a post to a connection via message.

**Endpoint:** `POST /messages/share-post`

**Query Parameters:**
- `receiver_id` (string, required): ID of the user to send to
- `post_id` (string, required): ID of the post to share
- `note` (string, optional): Optional note with the share

**Response:**
```json
{
  "id": "message_id",
  "sender_id": "user_id",
  "receiver_id": "user_id",
  "content": "Check this out!",
  "message_type": "post_share",
  "shared_post_id": "post_id",
  "read": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/messages/share-post?receiver_id=USER_ID&post_id=POST_ID&note=Check%20this%20out!" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Send Message with Attachment

Send a message with a file attachment.

**Endpoint:** `POST /messages/{receiver_id}/attachment`

**Form Data:**
- `file` (file, required): File to attach (max 10MB)
- `content` (string, optional): Message content

**Response:**
```json
{
  "id": "message_id",
  "sender_id": "user_id",
  "receiver_id": "user_id",
  "content": "Sent file.pdf",
  "message_type": "attachment",
  "attachment_url": "/uploads/messages/file.pdf",
  "attachment_type": "application/pdf",
  "attachment_name": "file.pdf",
  "read": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/messages/USER_ID/attachment" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "content=Here is the file"
```

---

## Connections Endpoints

### Send Connection Request

Send a connection request to a user.

**Endpoint:** `POST /users/{user_id}/connect`

**Response:**
```json
{
  "message": "Connection request sent"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/users/USER_ID/connect" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Accept Connection Request

Accept a pending connection request.

**Endpoint:** `POST /users/{user_id}/accept`

**Response:**
```json
{
  "message": "Connection accepted"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/users/USER_ID/accept" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Decline Connection Request

Decline a pending connection request.

**Endpoint:** `POST /users/{user_id}/decline`

**Response:**
```json
{
  "message": "Connection request rejected"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/users/USER_ID/decline" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Remove Connection

Remove/unfriend a connection.

**Endpoint:** `DELETE /users/connections/{user_id}`

**Response:**
```json
{
  "message": "Connection removed successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/api/users/connections/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Connections

Get paginated list of user's connections.

**Endpoint:** `GET /users/connections/list`

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Maximum number of records (default: 20, max: 100)

**Response:**
```json
[
  {
    "id": "user_id",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "headline": "Software Engineer",
    "location": "San Francisco, CA",
    "profile_picture": "https://example.com/avatar.jpg"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/users/connections/list?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Connection Requests

Get pending connection requests for the current user.

**Endpoint:** `GET /users/connection-requests/list`

**Response:**
```json
[
  {
    "id": "user_id",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "headline": "Product Manager",
    "location": "New York, NY",
    "profile_picture": "https://example.com/avatar.jpg"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/users/connection-requests/list" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notifications Endpoints

### Get Notifications

Get user notifications.

**Endpoint:** `GET /notifications`

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Maximum number of records (default: 20, max: 100)
- `unread_only` (bool, optional): Filter to unread only (default: false)

**Response:**
```json
[
  {
    "id": "notification_id",
    "user_id": "user_id",
    "type": "application_status_update",
    "title": "Application Status Updated",
    "message": "Your application for Software Engineer has been updated to shortlisted",
    "read": false,
    "created_at": "2024-01-01T00:00:00Z",
    "related_user_id": "user_id",
    "related_job_id": "job_id"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/notifications?skip=0&limit=20&unread_only=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get Unread Count

Get count of unread notifications.

**Endpoint:** `GET /notifications/unread/count`

**Response:**
```json
{
  "count": 5
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/notifications/unread/count" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Mark Notification as Read

Mark a notification as read.

**Endpoint:** `PUT /notifications/{notification_id}/read`

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/api/notifications/NOTIFICATION_ID/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Mark All Notifications as Read

Mark all notifications as read.

**Endpoint:** `PUT /notifications/read-all`

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/api/notifications/read-all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "Field is required",
      "type": "value_error"
    }
  ]
}
```

---

## WebSocket Events

### Connection

Connect to WebSocket with token:
```
ws://localhost:8000/socket.io/?token=YOUR_TOKEN
```

### Events

#### `notification`
Received when a new notification is created:
```json
{
  "id": "notification_id",
  "type": "application_status_update",
  "title": "Application Status Updated",
  "message": "Your application status has been updated",
  "read": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### `new_message`
Received when a new message arrives:
```json
{
  "id": "message_id",
  "sender_id": "user_id",
  "receiver_id": "user_id",
  "content": "Hello!",
  "message_type": "text",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### `application_status_update`
Received when application status is updated:
```json
{
  "application_id": "application_id",
  "status": "shortlisted",
  "message": "Your application has been shortlisted"
}
```

#### `typing`
Received when user is typing:
```json
{
  "sender_id": "user_id",
  "typing": true
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

List endpoints support pagination using `skip` and `limit` parameters:

- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 20, max: 100)

Example:
```
GET /api/jobs/my-applications/list?skip=20&limit=20
```

---

## File Uploads

File uploads are supported for:
- Resume files (job applications): Max 5MB, PDF/DOC/DOCX
- Message attachments: Max 10MB, PDF/DOC/DOCX/Images

Use `multipart/form-data` content type for file uploads.

---

## Testing

See `backend/tests/` for integration tests:
- `test_job_applications.py` - Application flow tests
- `test_connections_feed.py` - Connections and feed tests
- `test_messaging_connections.py` - Messaging and connections tests

Run tests:
```bash
cd backend
pytest tests/ -v
```

