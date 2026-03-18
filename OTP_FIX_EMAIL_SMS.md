# Current OTP Status & How to Fix

## Current Status ❌
- OTP endpoints are returning codes (Test passed)
- **But emails/SMS are NOT actually being sent**
- This means `OTP_DEBUG_MODE=true` is set on Railway

## Why Users Aren't Getting Emails/SMS

The system is in **test/debug mode** and doesn't send real emails. It only returns the OTP code in the API response (useful for testing but not production).

---

## Solution: Enable Real Email Sending

To make OTP emails actually work, follow these steps:

### Step 1: Get Gmail App Password

**Why Gmail?** Free, reliable, and easy to set up.

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" (if needed)
3. Go to https://myaccount.google.com/apppasswords
4. Select: Mail → Windows Computer
5. Copy the 16-character password (looks like: `xxxx xxxx xxxx xxxx`)

### Step 2: Update Railway Environment Variables

Go to Railway Dashboard:
1. Select your **backend service**
2. Go to **Variables** tab
3. Find and update these (or create if missing):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Sync Platform
SMTP_FROM_EMAIL=your-gmail@gmail.com
OTP_DEBUG_MODE=false
```

**Important:** 
- `SMTP_USER` must be your actual Gmail address
- `SMTP_PASSWORD` is the 16-char app password (not your Gmail password)
- Set `OTP_DEBUG_MODE=false` to send real emails

### Step 3: Redeploy Backend

After updating variables:
1. Go to Railway Dashboard
2. Deployments tab
3. Wait for new deployment (usually 2-3 minutes)
4. Check logs for: `Email sent to...`

### Step 4: Test Email OTP

Once redeployed, users will:
1. Click "Send OTP to Email"
2. Get an email from "Sync Platform" with a 6-digit code
3. Users paste code to verify

---

## For SMS (Optional - Twilio)

If you want SMS OTP support:

1. Go to https://www.twilio.com/try-twilio (free trial)
2. Sign up and get:
   - Account SID
   - Auth Token  
   - Twilio Phone Number

3. Add to Railway Variables:
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

---

## Current Configuration Status

Run this to check current settings (local backend):
```bash
echo "SMTP User: $(grep SMTP_USER backend/.env)"
echo "Debug Mode: $(grep OTP_DEBUG backend/.env)"
```

Expected output for production:
```
SMTP_USER=your-account@gmail.com
OTP_DEBUG_MODE=false
```

---

## Verification Checklist

After setting up Gmail:

✅ `SMTP_USER` = your Gmail address  
✅ `SMTP_PASSWORD` = 16-char app password  
✅ `OTP_DEBUG_MODE` = false  
✅ Backend redeployed  
✅ Users receive emails with OTP codes

---

## Troubleshooting

**Issue:** "Still not receiving emails"
- ✅ Check spam/junk folder
- ✅ Verify SMTP_PASSWORD is the app password (not Gmail password)
- ✅ Check Railway logs for SMTP errors

**Issue:** "SMTP Authentication failed"  
- ✅ Use app password, not Gmail password
- ✅ App password must have spaces: `xxxx xxxx xxxx xxxx`

**Issue:** "Emails marked as spam"
- ✅ Gmail app passwords are generally trusted
- ✅ Configure SPF/DKIM if experiencing issues

