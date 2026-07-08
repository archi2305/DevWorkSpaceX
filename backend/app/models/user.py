import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database.db import Base

class User(Base):
    """
    User database model.
    """
    __tablename__ = "users"

    # UUID primary key using PostgreSQL native UUID
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    # User email, indexed and unique for quick lookups
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    
    # User's display name
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    # Hashed password (never store plain-text passwords!)
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    # Profile image URL (nullable, allows users to register without one)
    profile_image: Mapped[Optional[str]] = mapped_column(
        String(1024),
        nullable=True
    )
    
    # Account status flag
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    # Timestamp trackers
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
