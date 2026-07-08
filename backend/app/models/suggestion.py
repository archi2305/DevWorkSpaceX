import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class AISuggestion(Base):
    """
    SQLAlchemy database model mapping suggestions dispatched to workspace users.
    """
    __tablename__ = "ai_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # User target receiving suggestions
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Priority indicator ('high', 'medium', 'low')
    priority: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    
    # Suggestion headline
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Descriptive body text
    description: Mapped[str] = mapped_column(String(1024), nullable=False)
    
    # Interactive action button text (e.g. 'Review', 'Update')
    action: Mapped[str] = mapped_column(String(100), default="Review", nullable=False)
    
    # Graphic display icon/emoji representing the suggestion card
    icon: Mapped[str] = mapped_column(String(50), default="⚡", nullable=False)
    
    # Creation timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user = relationship("User", backref="ai_suggestions")
