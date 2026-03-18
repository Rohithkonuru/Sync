import random
import string
import logging
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_database
from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# OTP generation & storage
# ---------------------------------------------------------------------------

def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


async def store_otp(identifier: str, otp: str, otp_type: str, expires_in_minutes: int = 10):
    db = get_database()
    expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    otp_data = {
        "identifier": identifier,
        "otp": otp,
        "type": otp_type,
        "expires_at": expires_at,
        "created_at": datetime.utcnow(),
        "verified": False,
    }
    await db.otps.update_one(
        {"identifier": identifier, "type": otp_type},
        {"$set": otp_data},
        upsert=True,
    )


async def verify_otp(identifier: str, otp: str, otp_type: str) -> bool:
    db = get_database()
    otp_record = await db.otps.find_one(
        {"identifier": identifier, "type": otp_type, "verified": False}
    )
    if not otp_record:
        return False
    if datetime.utcnow() > otp_record["expires_at"]:
        await db.otps.delete_one({"_id": otp_record["_id"]})
        return False
    if otp_record["otp"] != otp:
        return False
    await db.otps.update_one(
        {"_id": otp_record["_id"]},
        {"$set": {"verified": True, "verified_at": datetime.utcnow()}},
    )
    return True


async def cleanup_expired_otps():
    db = get_database()
    await db.otps.delete_many({"expires_at": {"$lt": datetime.utcnow()}})


# ---------------------------------------------------------------------------
# Email OTP  (async SMTP via aiosmtplib)
# ---------------------------------------------------------------------------

def _build_otp_email_html(otp: str, purpose: str = "verification") -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);
                     padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;
                       letter-spacing:-0.5px;">Sync</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
              Your professional network
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">
              Verify your {purpose}
            </h2>
            <p style="margin:0 0 32px;color:#64748b;font-size:15px;line-height:1.6;">
              Use the one-time code below. It expires in <strong>10 minutes</strong>.
            </p>
            <!-- OTP Box -->
            <div style="background:#f1f5f9;border:2px dashed #6366f1;border-radius:10px;
                        padding:24px;text-align:center;margin-bottom:32px;">
              <span style="font-size:42px;font-weight:700;letter-spacing:12px;
                           color:#4f46e5;font-family:monospace;">{otp}</span>
            </div>
            <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">
              If you did not request this code, you can safely ignore this email.
            </p>
            <p style="margin:0;color:#94a3b8;font-size:13px;">
              For security, never share this code with anyone.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;
                     border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              &copy; 2026 Sync Platform. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


async def send_email_otp(email: str, purpose: str = "email verification") -> str:
    otp = generate_otp()
    await store_otp(email, otp, "email")

    if not settings.smtp_user or not settings.smtp_password:
        logger.warning(f"[OTP] SMTP not configured — OTP for {email}: {otp}")
        return otp

    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Sync verification code: {otp}"
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = email

        msg.attach(MIMEText(f"Your Sync OTP is: {otp}  (valid 10 minutes)", "plain"))
        msg.attach(MIMEText(_build_otp_email_html(otp, purpose), "html"))

        # Use SSL (implicit TLS) for port 465, STARTTLS for port 587
        use_tls = settings.smtp_port == 587
        
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=use_tls,
            start_tls=(not use_tls),  # Start TLS for 587, SSL for 465
        )
        logger.info(f"[OTP] Email sent to {email}")
    except Exception as e:
        logger.error(f"[OTP] Failed to send email OTP: {e}")
        # OTP is still stored — caller can handle the error if needed
        raise

    return otp


# ---------------------------------------------------------------------------
# SMS OTP  (Twilio)
# ---------------------------------------------------------------------------

async def send_sms_otp(phone: str) -> str:
    otp = generate_otp()
    await store_otp(phone, otp, "phone")

    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning(f"[OTP] Twilio not configured — OTP for {phone}: {otp}")
        return otp

    try:
        import asyncio
        from functools import partial
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        send = partial(
            client.messages.create,
            body=f"Your Sync verification code is: {otp}  (valid 10 minutes)",
            from_=settings.twilio_phone_number,
            to=phone,
        )
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, send)
        logger.info(f"[OTP] SMS sent to {phone}")
    except Exception as e:
        logger.error(f"[OTP] Failed to send SMS OTP: {e}")
        raise

    return otp

