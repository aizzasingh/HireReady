from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    firstName: str
    lastName: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserOut


class ResumeListItem(BaseModel):
    id: uuid.UUID
    filename: str
    uploadedAt: datetime
    ats: int
    jobfit: int
    content: int
