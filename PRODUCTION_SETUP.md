# Production Setup Guide - Multi-User Support

## Overview
Your application is deployed on Railway.app and needs proper configuration for multiple users to work simultaneously.

## Issue: Only One User Can Access the Site
**Root Cause:** Missing or incorrect environment variables on Railway that prevent multiple users from authenticating and accessing the database.

---

## Step-by-Step Fix

### 1. Set Up MongoDB Atlas (Cloud Database)

**Why:** Local MongoDB (localhost) doesn't work on cloud deployment. You need a cloud database.

**Steps:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up (free tier available)
2. Create a new cluster (choose free tier)
3. Create a database named `sync`
4. Create a user with a strong password
5. Click "Connect" → "Drivers" → Copy the connection string
   - It should look like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sync`

---

### 2. Update Railway Environment Variables

Go to your Railway project dashboard and set these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sync
JWT_SECRET=your-very-strong-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=[Leave empty for production - will allow all origins]
UPLOAD_DIR=./uploads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Important Fields:**
- **MONGODB_URI**: Replace with your MongoDB Atlas connection string
- **JWT_SECRET**: Generate a strong random secret (min 32 characters)
- **CORS_ORIGINS**: Leave empty or omit - backend will allow all origins
- **SMTP_***: Configure if you have email support

---

### 3. Verify the Backend Configuration

The backend now automatically:
- ✅ Allows multiple users from any origin
- ✅ Uses connection pooling (up to 50 concurrent connections)
- ✅ Retries failed connections
- ✅ Supports multiple simultaneous logins

---

## Testing Multi-User Access

1. **Test User 1:**
   - Open incognito window
   - Navigate to your site
   - Register/Login with user1@example.com

2. **Test User 2:**
   - Open another incognito window (or different browser)
   - Navigate to your site
   - Register/Login with user2@example.com

3. **Verify:**
   - Both should see "Connected successfully" messages
   - No network errors
   - Each sees their own dashboard

---

## Troubleshooting

### Error: "Network Error" or "Cannot Connect"
**Solution:** Check that MONGODB_URI is correct and connection string is accessible

### Only One User Can Login
**Solution:** 
1. Check CORS_ORIGINS is empty (not set to specific domains)
2. Verify MONGODB_URI is a cloud connection, not localhost
3. Check Railway logs for "Connection refused" errors

### Multiple Users Get 503 Errors
**Solution:** Database connection pool is exhausted
1. Increase `maxPoolSize` in database.py (already set to 50)
2. Check MongoDB Atlas has enough connections available
3. Restart the Railway app

---

## MongoDB Atlas Connection String Format

When copying from MongoDB Atlas, the URL looks like:
```
mongodb+srv://syncuser:password@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

**Update the URL to:**
```
mongodb+srv://syncuser:password@cluster0.abc123.mongodb.net/sync
```
- Change the database name from `?retryWrites...` to `/sync`

---

## After Setting Up

1. Restart the Railway app (push a small change or use Railway dashboard)
2. Try registering 2 different users
3. Test messaging, posts, and other features with both users
4. Monitor Railway logs for any connection errors

---

## Need Help?

Check the logs in Railway dashboard:
1. Go to your project
2. Click "Deployments"
3. View the latest deployment logs
4. Look for "Connected to MongoDB" or error messages

