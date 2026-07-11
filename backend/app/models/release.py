import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class Release(Base):
    """
    Release database model representing software versions, release notes, status and timelines.
    """
    __tablename__ = "releases"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. 'v1.0.0'
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    release_notes: Mapped[str | None] = mapped_column(Text, nullable=True) # Markdown Notes
    status: Mapped[str] = mapped_column(String(50), default="Draft", nullable=False) # 'Draft', 'Unreleased', 'Released'
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", backref="releases")
