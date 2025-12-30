import random
import string
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_database
import asyncio

# In-memory storage for OTPs (in production, use Redis)
otp_storage = {}

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))

async def store_otp(identifier: str, otp: str, otp_type: str, expires_in_minutes: int = 10):
    """Store OTP with expiration"""
    db = get_database()
    expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    
    otp_data = {
        "identifier": identifier,
        "otp": otp,
        "type": otp_type,  # 'email' or 'phone'
        "expires_at": expires_at,
        "created_at": datetime.utcnow(),
        "verified": False
    }
    
    # Store in database
    await db.otps.update_one(
        {"identifier": identifier, "type": otp_type},
        {"$set": otp_data},
        upsert=True
    )
    
    # Also store in memory for quick access
    otp_storage[f"{identifier}:{otp_type}"] = {
        "otp": otp,
        "expires_at": expires_at,
        "verified": False
    }

async def verify_otp(identifier: str, otp: str, otp_type: str) -> bool:
    """Verify OTP"""
    db = get_database()
    
    # Check database
    otp_record = await db.otps.find_one({
        "identifier": identifier,
        "type": otp_type,
        "verified": False
    })
    
    if not otp_record:
        return False
    
    # Check expiration
    if datetime.utcnow() > otp_record["expires_at"]:
        await db.otps.delete_one({"_id": otp_record["_id"]})
        return False
    
    # Verify OTP
    if otp_record["otp"] != otp:
        return False
    
    # Mark as verified
    await db.otps.update_one(
        {"_id": otp_record["_id"]},
        {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
    )
    
    # Remove from memory
    otp_storage.pop(f"{identifier}:{otp_type}", None)
    
    return True

async def send_email_otp(email: str) -> str:
    """Send OTP via email (placeholder - implement with email service)"""
    otp = generate_otp()
    await store_otp(email, otp, "email")
    
    # TODO: Implement actual email sending service
    # For now, just print (in production, use SendGrid, AWS SES, etc.)
    print(f"OTP for {email}: {otp}")
    
    return otp

async def send_sms_otp(phone: str) -> str:
    """Send OTP via SMS (placeholder - implement with SMS service)"""
    otp = generate_otp()
    await store_otp(phone, otp, "phone")
    
    # TODO: Implement actual SMS sending service
    # For now, just print (in production, use Twilio, AWS SNS, etc.)
    print(f"OTP for {phone}: {otp}")
    
    return otp

async def cleanup_expired_otps():
    """Clean up expired OTPs from database"""
    db = get_database()
    await db.otps.delete_many({"expires_at": {"$lt": datetime.utcnow()}})

