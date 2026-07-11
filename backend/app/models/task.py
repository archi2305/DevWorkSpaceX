import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, JSON
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
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Todo", nullable=False)
    
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

    # Associated sprint ID pointing to sprints
    sprint_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sprints.id", ondelete="SET NULL"),
        nullable=True
    )

    # Production extensions
    story_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_time: Mapped[int | None] = mapped_column(Integer, nullable=True) # Hours
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    attachments: Mapped[list | None] = mapped_column(JSON, default=list, nullable=True)
    
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
    sprint = relationship("Sprint", backref="tasks")
    labels = relationship("Label", secondary="task_labels", back_populates="tasks")
