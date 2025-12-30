# API Examples - Complete Guide

## Base URL
```
http://localhost:8000
```

## Authentication
All endpoints (except auth) require a Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Apply for Job (with Resume Upload)

### cURL
```bash
curl -X POST "http://localhost:8000/api/jobs/{job_id}/apply" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "full_name=John Doe" \
  -F "email=john@example.com" \
  -F "contact_number=+1234567890" \
  -F "address=123 Main St, City, State" \
  -F "cover_letter=I am very interested in this position..." \
  -F "contact_email=john@example.com" \
  -F "contact_phone=+1234567890" \
  -F "portfolio_url=https://portfolio.example.com" \
  -F "skills=[\"Python\", \"FastAPI\", \"React\"]" \
  -F "experience_years=5" \
  -F "custom_fields={\"availability\": \"immediate\"}" \
  -F "resume_file=@/path/to/resume.pdf"
```

### Postman
1. Method: `POST`
2. URL: `http://localhost:8000/api/jobs/{job_id}/apply`
3. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
4. Body: `form-data`
   - `full_name`: John Doe
   - `email`: john@example.com
   - `contact_number`: +1234567890
   - `address`: 123 Main St, City, State
   - `cover_letter`: I am very interested...
   - `portfolio_url`: https://portfolio.example.com
   - `skills`: `["Python", "FastAPI"]` (JSON string)
   - `experience_years`: 5
   - `resume_file`: (File) Select PDF/DOC file

### Response
```json
{
  "message": "Application submitted successfully",
  "application_id": "507f1f77bcf86cd799439011"
}
```

---

## 2. List Applications (Recruiter)

### cURL
```bash
curl -X GET "http://localhost:8000/api/jobs/{job_id}/applications" \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

### Postman
1. Method: `GET`
2. URL: `http://localhost:8000/api/jobs/{job_id}/applications`
3. Headers: `Authorization: Bearer RECRUITER_TOKEN`

### Response
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "job_id": "507f1f77bcf86cd799439012",
    "applicant_id": "507f1f77bcf86cd799439013",
    "full_name": "John Doe",
    "email": "john@example.com",
    "contact_number": "+1234567890",
    "address": "123 Main St",
    "cover_letter": "I am very interested...",
    "resume_file_url": "/uploads/resumes/uuid.pdf",
    "portfolio_url": "https://portfolio.example.com",
    "skills": ["Python", "FastAPI"],
    "experience_years": 5,
    "status": "submitted",
    "applied_at": "2024-01-15T10:30:00Z",
    "applicant": {
      "id": "507f1f77bcf86cd799439013",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "headline": "Software Engineer",
      "location": "San Francisco, CA"
    },
    "status_history": [
      {
        "status": "submitted",
        "updated_at": "2024-01-15T10:30:00Z",
        "updated_by": "507f1f77bcf86cd799439013",
        "note": "Application submitted"
      }
    ]
  }
]
```

---

## 3. Download Resume

### cURL
```bash
curl -X GET "http://localhost:8000/api/jobs/applications/{application_id}/resume" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o resume.pdf
```

### Postman
1. Method: `GET`
2. URL: `http://localhost:8000/api/jobs/applications/{application_id}/resume`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Send and Download: Check "Send and Download"

### Response
Binary file (PDF/DOC)

---

## 4. Update Application Status

### cURL
```bash
curl -X PUT "http://localhost:8000/api/jobs/applications/{application_id}/status" \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shortlisted",
    "note": "Great candidate, moving to next round"
  }'
```

### Postman
1. Method: `PUT`
2. URL: `http://localhost:8000/api/jobs/applications/{application_id}/status`
3. Headers:
   - `Authorization: Bearer RECRUITER_TOKEN`
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "status": "shortlisted",
  "note": "Great candidate, moving to next round"
}
```

### Valid Statuses
- `drafted`
- `submitted`
- `seen`
- `in-processing`
- `shortlisted`
- `accepted`
- `rejected`

### Response
```json
{
  "message": "Application status updated successfully"
}
```

---

## 5. Delete Application

### cURL
```bash
curl -X DELETE "http://localhost:8000/api/jobs/applications/{application_id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman
1. Method: `DELETE`
2. URL: `http://localhost:8000/api/jobs/applications/{application_id}`
3. Headers: `Authorization: Bearer YOUR_TOKEN`

### Response
```json
{
  "message": "Application deleted successfully"
}
```

---

## 6. Search Candidates

### cURL
```bash
curl -X GET "http://localhost:8000/api/users/search?user_type=job_seeker&location=San Francisco&skills=Python,React&experience_years_min=2&experience_years_max=10" \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

### Postman
1. Method: `GET`
2. URL: `http://localhost:8000/api/users/search`
3. Headers: `Authorization: Bearer RECRUITER_TOKEN`
4. Params:
   - `user_type`: job_seeker
   - `location`: San Francisco
   - `skills`: Python,React
   - `experience_years_min`: 2
   - `experience_years_max`: 10
   - `query`: (optional) text search
   - `skip`: 0
   - `limit`: 20

### Response
```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "first_name": "Jane",
    "last_name": "Doe",
    "headline": "Full Stack Developer",
    "location": "San Francisco, CA",
    "skills": ["Python", "React", "Node.js"],
    "experience_years": 5,
    "profile_picture": "/uploads/profile.jpg"
  }
]
```

---

## 7. Accept Connection Request

### cURL
```bash
curl -X POST "http://localhost:8000/api/users/{user_id}/accept" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman
1. Method: `POST`
2. URL: `http://localhost:8000/api/users/{user_id}/accept`
3. Headers: `Authorization: Bearer YOUR_TOKEN`

### Response
```json
{
  "message": "Connection accepted"
}
```

---

## 8. Reject Connection Request

### cURL
```bash
curl -X POST "http://localhost:8000/api/users/{user_id}/reject" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman
1. Method: `POST`
2. URL: `http://localhost:8000/api/users/{user_id}/reject`
3. Headers: `Authorization: Bearer YOUR_TOKEN`

---

## 9. Remove Connection

### cURL
```bash
curl -X DELETE "http://localhost:8000/api/users/connections/{user_id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman
1. Method: `DELETE`
2. URL: `http://localhost:8000/api/users/connections/{user_id}`
3. Headers: `Authorization: Bearer YOUR_TOKEN`

---

## 10. Get Notifications

### cURL
```bash
curl -X GET "http://localhost:8000/api/notifications?limit=20&unread_only=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman
1. Method: `GET`
2. URL: `http://localhost:8000/api/notifications`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Params:
   - `skip`: 0
   - `limit`: 20
   - `unread_only`: false

### Response
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "user_id": "507f1f77bcf86cd799439013",
    "type": "job_application",
    "title": "New Job Application",
    "message": "John Doe applied for Software Engineer",
    "read": false,
    "created_at": "2024-01-15T10:30:00Z",
    "related_job_id": "507f1f77bcf86cd799439012",
    "related_user_id": "507f1f77bcf86cd799439013"
  }
]
```

---

## 11. Mark Notification as Read

### cURL
```bash
curl -X PUT "http://localhost:8000/api/notifications/{notification_id}/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman
1. Method: `PUT`
2. URL: `http://localhost:8000/api/notifications/{notification_id}/read`
3. Headers: `Authorization: Bearer YOUR_TOKEN`

---

## 12. Get Unread Notification Count

### cURL
```bash
curl -X GET "http://localhost:8000/api/notifications/unread/count" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "count": 5
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid file type. Only PDF and DOC files are allowed"
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
  "detail": "Only the job poster can view applications"
}
```

### 404 Not Found
```json
{
  "detail": "Job not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## Testing with Postman Collection

Import this collection into Postman:

```json
{
  "info": {
    "name": "Job Applications API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Apply for Job",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {"key": "full_name", "value": "John Doe", "type": "text"},
            {"key": "email", "value": "john@example.com", "type": "text"},
            {"key": "cover_letter", "value": "I am interested...", "type": "text"},
            {"key": "resume_file", "type": "file", "src": []}
          ]
        },
        "url": {
          "raw": "{{base_url}}/api/jobs/:job_id/apply",
          "host": ["{{base_url}}"],
          "path": ["api", "jobs", ":job_id", "apply"],
          "variable": [
            {"key": "job_id", "value": ""}
          ]
        }
      }
    }
  ]
}
```

