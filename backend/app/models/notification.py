import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class Notification(Base):
    """
    SQLAlchemy database model mapping notifications dispatched to workspace users.
    """
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Target user receiving the notification
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Notification title summary
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Full message body context
    message: Mapped[str] = mapped_column(String(1024), nullable=False)
    
    # Completed/read state indicator
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user = relationship("User", backref="notifications")
