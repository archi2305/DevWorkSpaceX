"""
AI Conversation History Model

Stores conversation history for AI Sprint Planner interactions.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base


class AIConversation(Base):
    """
    SQLAlchemy model for AI conversation history.
    Stores user interactions with the AI Sprint Planner.
    """
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # User who initiated the conversation
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Type of conversation (sprint_planning, task_analysis, etc.)
    conversation_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Context for the conversation (project_id, sprint_id, etc.)
    context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Messages in the conversation
    messages: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Summary of the conversation
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Tokens used (for cost tracking)
    tokens_used: Mapped[int] = mapped_column(default=0)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    
    # Last updated timestamp
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user = relationship("User", backref="ai_conversations")
