# OTP Setup Guide - Email and SMS Configuration

## Problem
OTP (One-Time Password) is not being sent to email or phone because credentials are not configured.

## Solution: Set Up Gmail SMTP for Email OTP

### Step 1: Enable Gmail 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification" (if not already enabled)

### Step 2: Generate Gmail App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer"
3. Google generates a 16-character password
4. Copy this password

### Step 3: Update Railway Environment Variables

Go to Railway Dashboard → Your Backend Service → Variables → Add/Edit:

| Variable | Value | Notes |
|----------|-------|-------|
| `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP server |
| `SMTP_PORT` | `587` | TLS port |
| `SMTP_USER` | `your-email@gmail.com` | Your Gmail address |
| `SMTP_PASSWORD` | `xxxx xxxx xxxx xxxx` | 16-char app password from Step 2 |
| `SMTP_FROM_NAME` | `Sync Platform` | Email display name |
| `SMTP_FROM_EMAIL` | `your-email@gmail.com` | Must match SMTP_USER |

### Step 4: Optional - Set Up Twilio for SMS OTP

For SMS OTP (optional):
1. Go to [Twilio](https://www.twilio.com/try-twilio)
2. Sign up (free trial with $15 credit)
3. Get your:
   - Account SID
   - Auth Token
   - Twilio Phone Number

Add to Railway Variables:
| Variable | Value |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | Your Account SID |
| `TWILIO_AUTH_TOKEN` | Your Auth Token |
| `TWILIO_PHONE_NUMBER` | Your Twilio number (+1XXXXXXXXXX) |

### Step 5: Restart Backend

After setting environment variables:
1. Go to Railway Dashboard
2. Click your backend service
3. Go to "Deployments"
4. Trigger a new deployment (or wait for auto-redeploy)

---

## Testing OTP

### Test Email OTP:
```bash
curl -X POST https://sync-backend-production.up.railway.app/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@test.com"}'
```

Expected response:
```json
{
  "message": "OTP sent to email",
  "success": true
}
```

You should receive an email with a 6-digit OTP code.

### Test SMS OTP:
```bash
curl -X POST https://sync-backend-production.up.railway.app/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

---

## Troubleshooting

### "Failed to send email OTP" Error
**Solution:** Check your Gmail app password
- Verify it's a 16-character password (from Step 2)
- Make sure "Less secure app access" is NOT needed (app passwords bypass it)
- Check SMTP_USER matches your Gmail address

### "SMTP not configured" (Logs show OTP but don't send)
**Solution:** Set SMTP credentials on Railway
- Don't use `your-email@gmail.com` (it's a placeholder)
- Use your actual Gmail address and app password

### SMS Not Sending
**Solution:** 
1. Set up Twilio account if not done
2. Verify phone number format: `+1XXXXXXXXXX`
3. Check Twilio has credits available

---

## Alternative: Test Mode

If you don't want to set up email yet, you can enable debug mode:

Add to Railway Variables:
```
OTP_DEBUG_MODE=true
```

This will return the OTP in the API response (for testing only, disable in production).

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit credentials to Git
- Use Railway environment variables
- Don't share app passwords
- In production, disable OTP_DEBUG_MODE

