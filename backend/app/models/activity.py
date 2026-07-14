import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class ActivityLog(Base):
    """
    SQLAlchemy database model mapping user and team actions to activity logs.
    Enhanced with audit categories and event types for comprehensive tracking.
    """
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Associated user executing the action
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Audit category for filtering (login, permission, project, task, document)
    category: Mapped[str] = mapped_column(String(50), nullable=True, index=True)
    
    # Event type for granular tracking (create, update, delete, view, export, etc.)
    event_type: Mapped[str] = mapped_column(String(50), nullable=True, index=True)
    
    # Summary descriptor of the action (e.g. 'Created project milestone')
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Detailed text description of the action
    details: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Target item classification type (e.g. 'Project', 'Task')
    target_type: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    
    # Target item name
    target_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Target item ID for direct reference
    target_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    
    # IP address of the user
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    
    # User agent string
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Additional metadata as JSON
    metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationships
    user = relationship("User", backref="activity_logs")
