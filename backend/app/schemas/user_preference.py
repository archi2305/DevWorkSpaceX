import uuid
from pydantic import BaseModel
from typing import Optional

class UserPreferenceUpdate(BaseModel):
    theme: Optional[str] = None # 'Dark', 'Light', 'System'
    accent_color: Optional[str] = None
    keyboard_shortcuts_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    in_app_notifications: Optional[bool] = None
    language: Optional[str] = None

class UserPreferenceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    theme: str
    accent_color: str
    keyboard_shortcuts_enabled: bool
    email_notifications: bool
    in_app_notifications: bool
    language: str

    class Config:
        from_attributes = True
