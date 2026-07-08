import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Table, ForeignKey, Column
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
    Project database model.
    """
    __tablename__ = "projects"

    # UUID primary key
    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id") if False else None,
        primary_key=True,
        default=uuid.uuid4
    )
    
    # Project name
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Optional project description
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    
    # Project status (e.g. 'Pending', 'In Progress', 'Review')
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)
    
    # Progress percentage (0 - 100)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Owner ID representing the project creator
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
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
    # Many-to-many relationship mapping users who are part of this project's team
    members = relationship(
        "User",
        secondary=project_members,
        backref="projects"
    )
