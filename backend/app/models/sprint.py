import uuid
from datetime import datetime
from sqlalchemy import Boolean, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class Sprint(Base):
    """
    Sprint database model representing Jira-like agile sprint milestones.
    """
    __tablename__ = "sprints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    duration_weeks: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Planned", nullable=False) # 'Planned', 'Active', 'Completed'
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", backref="sprints")

    @property
    def total_story_points(self) -> int:
        return sum(task.story_points or 0 for task in self.tasks if not task.is_deleted)

    @property
    def completed_story_points(self) -> int:
        return sum(task.story_points or 0 for task in self.tasks if task.completed and not task.is_deleted)
