import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Table, ForeignKey, Column, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

# Association Table for Project Members (Many-to-Many relationship)
project_members = Table(
    "project_members",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("project_id", ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
)

class Project(Base):
    """
    Project database model with production schema extensions for Linear-style details.
    """
    __tablename__ = "projects"

    # UUID primary key
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )
    
    # Project name
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Project slug for URL routing (e.g. 'linear-app-clone')
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    # Optional project description
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    
    # Project icon (emoji or name)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Project cover image URL
    cover_image: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    
    # Project color code or theme token
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Project status (e.g. 'Pending', 'In Progress', 'Review', 'Completed')
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)
    
    # Project priority (e.g. 'Low', 'Medium', 'High', 'Urgent')
    priority: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)
    
    # Progress percentage (0 - 100)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Project user interaction tags
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Owner ID representing the project creator
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Optional multi-tenant workspace association
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    
    # Project privacy visibility level ('Workspace', 'Private', 'Public')
    visibility: Mapped[str] = mapped_column(String(50), default="Workspace", nullable=False)
    
    # Project deadline due date
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
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
    members = relationship(
        "User",
        secondary=project_members,
        backref="projects"
    )
