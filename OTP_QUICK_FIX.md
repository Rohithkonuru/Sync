# OTP Setup - Quick Reference

## Problem Found ✅
| Issue | Status | Cause |
|-------|--------|-------|
| Emails not sending | ✅ Found | Debug mode is ON, SMTP not configured |
| SMS not sending | ✅ Found | Twilio not configured |
| OTP endpoints | ✅ Working | Returning test codes |

---

## Quick Fix (5 Minutes)

### For Email OTP:

1. **Get Gmail App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" → "Windows"
   - Copy the 16-char password

2. **Go to Railway Dashboard:**
   - Backend Service → Variables tab

3. **Add/Update these variables:**
   ```
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_FROM_NAME=Sync Platform
   SMTP_FROM_EMAIL=your-gmail@gmail.com
   OTP_DEBUG_MODE=false
   ```

4. **Redeploy:**
   - Go to Deployments tab
   - Wait 2-3 minutes for new deployment

5. **Test:**
   - Users will receive real emails with OTP codes ✅

---

## For SMS OTP (Optional):

1. Sign up at https://www.twilio.com/try-twilio
2. Add to Railway:
   ```
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
   ```
3. Redeploy

---

## Files for Reference:
- 📄 See `OTP_FIX_EMAIL_SMS.md` for detailed guide
- 📄 See `OTP_SETUP_GUIDE.md` for Gmail setup help

---

## Test Command (After Setup):

```bash
curl -X POST https://sync-backend-production.up.railway.app/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

You should receive an email within seconds ✅

