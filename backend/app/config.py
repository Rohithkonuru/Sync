import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings"""
    def __init__(self):
        # MongoDB connection - use cloud database in production
        # For local development: mongodb://localhost:27017/sync
        # For production: Use MongoDB Atlas connection string from environment
        self.mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/sync")
        
        self.jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 hours
        self.upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
        
        # CORS Origins - allows multiple frontend domains
        # If not set in production, socket.io will use wildcard for all origins
        cors_origins_str = os.getenv("CORS_ORIGINS", "")
        if cors_origins_str:
            self.cors_origins: List[str] = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
        else:
            # Allow all origins in production for multi-user support
            self.cors_origins: List[str] = ["*"]

        # Email (SMTP) settings
        self.smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user: str = os.getenv("SMTP_USER", "")
        self.smtp_password: str = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from_name: str = os.getenv("SMTP_FROM_NAME", "Sync Platform")
        self.smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", self.smtp_user)

        # Twilio SMS settings
        self.twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.twilio_phone_number: str = os.getenv("TWILIO_PHONE_NUMBER", "")

        # Temporary debug toggle: when enabled, OTP can be returned in API response.
        self.otp_debug_mode: bool = os.getenv("OTP_DEBUG_MODE", "false").lower() == "true"

settings = Settings()

