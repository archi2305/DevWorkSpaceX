import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class Task(Base):
    """
    Task database model.
    """
    __tablename__ = "tasks"

    # UUID primary key
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )
    
    # Task title / description summary
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Task due date (text based for flexibility like 'Today', 'Tomorrow', 'Mar 15')
    due_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Task priority level ('low', 'medium', 'high')
    priority: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    
    # Boolean indicator for completion
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Associated assignee ID pointing to users
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Associated project ID pointing to projects
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    project = relationship("Project", backref="tasks")
    assignee = relationship("User", backref="tasks")
