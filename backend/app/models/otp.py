from pydantic import BaseModel, EmailStr
from typing import Optional

class OTPSendRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class OTPVerifyRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    otp: str

class OTPResponse(BaseModel):
    message: str
    success: bool

