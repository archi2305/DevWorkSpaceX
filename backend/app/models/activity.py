import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class ActivityLog(Base):
    """
    SQLAlchemy database model mapping user and team actions to activity logs.
    """
    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Associated user executing the action
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Summary descriptor of the action (e.g. 'Created project milestone')
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Detailed text description of the action
    details: Mapped[str] = mapped_column(String(1024), nullable=False)
    
    # Target item classification type (e.g. 'Project', 'Task')
    target_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Target item name
    target_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user = relationship("User", backref="activity_logs")
