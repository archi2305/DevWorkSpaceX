import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class UserPreference(Base):
    """
    Model representing per-user UI/system preferences.
    """
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    theme: Mapped[str] = mapped_column(String(50), default="System", nullable=False) # 'Dark', 'Light', 'System'
    accent_color: Mapped[str] = mapped_column(String(50), default="#5BB98C", nullable=False)
    keyboard_shortcuts_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    in_app_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    language: Mapped[str] = mapped_column(String(50), default="en", nullable=False) # 'en', 'es', 'fr', etc.

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="preferences", uselist=False)
