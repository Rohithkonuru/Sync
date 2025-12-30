# Database Migrations

## MongoDB Schema Updates

Since we're using MongoDB, migrations are handled through application code. Here are the schema changes needed:

### 1. Applications Collection - Enhanced Fields

```javascript
// Add new fields to applications collection
db.applications.updateMany(
  {},
  {
    $set: {
      contact_email: null,
      contact_phone: null,
      resume_file_url: null,
      additional_info: {},
      updated_at: new Date()
    }
  }
);

// Add index for faster queries
db.applications.createIndex({ "job_id": 1, "status": 1 });
db.applications.createIndex({ "user_id": 1, "status": 1 });
```

### 2. Messages Collection - Attachments Support

```javascript
// Add attachment fields to messages
db.messages.updateMany(
  {},
  {
    $set: {
      attachment_url: null,
      attachment_type: null,
      attachment_name: null,
      read_at: null
    }
  }
);

// Add indexes
db.messages.createIndex({ "sender_id": 1, "receiver_id": 1, "created_at": -1 });
db.messages.createIndex({ "receiver_id": 1, "read": 1 });
```

### 3. Users Collection - Experience Years

```javascript
// Add experience_years field for candidate search
db.users.updateMany(
  {},
  {
    $set: {
      experience_years: 0
    }
  }
);

// Calculate experience_years from experience array
db.users.find({ "experience": { $exists: true, $ne: [] } }).forEach(function(user) {
  let totalYears = 0;
  user.experience.forEach(function(exp) {
    if (exp.start_date && exp.end_date) {
      const start = new Date(exp.start_date);
      const end = exp.current ? new Date() : new Date(exp.end_date);
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      totalYears += Math.max(0, years);
    }
  });
  db.users.updateOne(
    { _id: user._id },
    { $set: { experience_years: Math.round(totalYears) } }
  );
});

// Add index for candidate search
db.users.createIndex({ "user_type": 1, "location": 1, "skills": 1, "experience_years": 1 });
db.users.createIndex({ "connections": 1 });
db.users.createIndex({ "connection_requests": 1 });
```

### 4. Notifications Collection - Already exists, ensure indexes

```javascript
db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 });
```

### 5. Connections Collection (Optional - for better performance)

If you want to create a separate connections collection for better querying:

```javascript
// Create connections collection
db.connections.insertMany([]);

// Migrate existing connections
db.users.find({ "connections": { $exists: true, $ne: [] } }).forEach(function(user) {
  user.connections.forEach(function(connId) {
    db.connections.insertOne({
      user_id: user._id.toString(),
      connection_id: connId,
      created_at: new Date(),
      status: "active"
    });
  });
});

db.connections.createIndex({ "user_id": 1, "connection_id": 1 }, { unique: true });
```

## Backward Compatibility Notes

- All new fields are optional (nullable)
- Existing queries will continue to work
- Default values are set for new fields
- No data loss during migration

