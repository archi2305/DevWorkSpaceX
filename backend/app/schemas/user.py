import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    """
    Shared attributes for user representations.
    """
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100, description="The user's display name")
    profile_image: Optional[str] = Field(None, max_length=1024, description="URL of the profile picture")
    bio: Optional[str] = Field(None, max_length=1024, description="User bio")
    skills: Optional[list] = Field(None, description="List of user skills")
    timezone: Optional[str] = Field("UTC", max_length=100, description="User timezone")

class UserRegister(UserBase):
    """
    Data required for user registration.
    Enforces password strength constraints.
    """
    password: str = Field(..., min_length=8, max_length=128, description="Password must be at least 8 characters")

class UserLogin(BaseModel):
    """
    Data required for user login.
    """
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list] = None
    timezone: Optional[str] = None

class UserResponse(UserBase):
    """
    The structure returned to clients.
    Inherits fields from UserBase and adds DB metadata.
    """
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Pydantic v2 configuration to serialize directly from ORM models (SQLAlchemy objects)
    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    """
    Structure of the authentication response.
    """
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """
    Internal structure of decoded JWT claims.
    """
    user_id: Optional[str] = None
