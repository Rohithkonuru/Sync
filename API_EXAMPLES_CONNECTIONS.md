# API Examples - Connections & Messaging

## Base URL
```
http://localhost:8000
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Connection Endpoints

### 1. Send Connection Request
```bash
curl -X POST "http://localhost:8000/api/connections/request" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "507f1f77bcf86cd799439011"
  }'
```

**Response:**
```json
{
  "message": "Connection request sent",
  "status": "requested"
}
```

### 2. Accept Connection Request
```bash
curl -X POST "http://localhost:8000/api/connections/507f1f77bcf86cd799439011/accept" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Looking forward to connecting!"
  }'
```

**Response:**
```json
{
  "message": "Connection accepted",
  "status": "connected"
}
```

### 3. Decline Connection Request
```bash
curl -X POST "http://localhost:8000/api/connections/507f1f77bcf86cd799439011/decline" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Connection request declined",
  "status": "declined"
}
```

### 4. Remove Connection (Unfriend)
```bash
curl -X DELETE "http://localhost:8000/api/connections/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Connection removed successfully",
  "status": "removed"
}
```

### 5. Get My Connections
```bash
# Get all connections
curl -X GET "http://localhost:8000/api/connections/me/connections?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search connections
curl -X GET "http://localhost:8000/api/connections/me/connections?skip=0&limit=20&search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "first_name": "John",
    "last_name": "Doe",
    "headline": "Software Engineer",
    "location": "San Francisco, CA",
    "profile_picture": "https://example.com/avatar.jpg",
    "skills": ["Python", "JavaScript", "React"]
  }
]
```

### 6. Get Incoming Connection Requests
```bash
curl -X GET "http://localhost:8000/api/connections/me/requests/incoming" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "first_name": "Jane",
    "last_name": "Smith",
    "headline": "Product Manager",
    "location": "New York, NY",
    "profile_picture": "https://example.com/avatar.jpg"
  }
]
```

### 7. Get Connection Status
```bash
curl -X GET "http://localhost:8000/api/connections/me/status/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "connected"
}
```

**Possible status values:**
- `not_connected` - No connection or request
- `request_sent` - You sent a request
- `request_received` - You received a request
- `connected` - Already connected
- `self` - Same user

## Messaging Endpoints

### 8. Send Message (Text Only)
```bash
curl -X POST "http://localhost:8000/api/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": "507f1f77bcf86cd799439011",
    "content": "Hello! How are you?",
    "message_type": "text"
  }'
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "sender_id": "507f1f77bcf86cd799439010",
  "receiver_id": "507f1f77bcf86cd799439011",
  "content": "Hello! How are you?",
  "message_type": "text",
  "read": false,
  "read_at": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Note:** This endpoint requires users to be connected. Returns 403 if not connected.

### 9. Send Message with Attachment
```bash
curl -X POST "http://localhost:8000/api/messages/507f1f77bcf86cd799439011/attachment?content=Check%20this%20out!" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "sender_id": "507f1f77bcf86cd799439010",
  "receiver_id": "507f1f77bcf86cd799439011",
  "content": "Check this out!",
  "message_type": "file",
  "attachment_url": "/uploads/507f1f77bcf86cd799439012.pdf",
  "attachment_type": "application/pdf",
  "attachment_name": "document.pdf",
  "read": false,
  "read_at": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 10. Get Conversations
```bash
curl -X GET "http://localhost:8000/api/messages/conversations/list" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "user_id": "507f1f77bcf86cd799439011",
    "user_name": "John Doe",
    "user_picture": "https://example.com/avatar.jpg",
    "last_message": {
      "id": "507f1f77bcf86cd799439012",
      "content": "Hello! How are you?",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "unread_count": 2,
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### 11. Get Conversation Messages
```bash
curl -X GET "http://localhost:8000/api/messages/conversations/507f1f77bcf86cd799439011?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "sender_id": "507f1f77bcf86cd799439010",
    "receiver_id": "507f1f77bcf86cd799439011",
    "content": "Hello! How are you?",
    "message_type": "text",
    "read": true,
    "read_at": "2024-01-15T10:31:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 12. Mark Message as Read
```bash
curl -X POST "http://localhost:8000/api/messages/507f1f77bcf86cd799439012/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Message marked as read"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden (Not Connected)
```json
{
  "detail": "You can only message users you are connected with"
}
```

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "user_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Postman Collection

### Environment Variables
- `base_url`: `http://localhost:8000`
- `token`: Your JWT token

### Example Postman Request
1. **Send Connection Request**
   - Method: POST
   - URL: `{{base_url}}/api/connections/request`
   - Headers:
     - `Authorization`: `Bearer {{token}}`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "user_id": "507f1f77bcf86cd799439011"
     }
     ```

2. **Accept Connection Request**
   - Method: POST
   - URL: `{{base_url}}/api/connections/507f1f77bcf86cd799439011/accept`
   - Headers:
     - `Authorization`: `Bearer {{token}}`

3. **Get My Connections**
   - Method: GET
   - URL: `{{base_url}}/api/connections/me/connections?skip=0&limit=20`
   - Headers:
     - `Authorization`: `Bearer {{token}}`

4. **Send Message**
   - Method: POST
   - URL: `{{base_url}}/api/messages`
   - Headers:
     - `Authorization`: `Bearer {{token}}`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "receiver_id": "507f1f77bcf86cd799439011",
       "content": "Hello!",
       "message_type": "text"
     }
     ```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:8000', {
  query: { token: 'YOUR_JWT_TOKEN' }
});
```

### Events

#### Receive Notification
```javascript
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // {
  //   "id": "...",
  //   "type": "connection_request",
  //   "title": "New Connection Request",
  //   "message": "John Doe wants to connect",
  //   "read": false,
  //   "created_at": "2024-01-15T10:30:00Z"
  // }
});
```

#### Receive Message
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data);
  // {
  //   "id": "...",
  //   "sender_id": "...",
  //   "receiver_id": "...",
  //   "content": "Hello!",
  //   "created_at": "2024-01-15T10:30:00Z"
  // }
});
```

#### Typing Indicator
```javascript
socket.on('typing', (data) => {
  console.log('User typing:', data);
  // {
  //   "sender_id": "...",
  //   "typing": true
  // }
});

// Send typing indicator
socket.emit('typing_start', {
  receiver_id: 'USER_ID',
  sender_id: 'YOUR_USER_ID'
});
```

