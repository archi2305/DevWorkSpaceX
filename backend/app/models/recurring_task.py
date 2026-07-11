import uuid
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class RecurringTask(Base):
    """
    Model representing Task recurrence configurations (Daily, Weekly, Monthly, Custom).
    """
    __tablename__ = "recurring_tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Todo", nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)
    
    project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    recurrence_pattern: Mapped[str] = mapped_column(String(50), nullable=False) # 'Daily', 'Weekly', 'Monthly', 'Custom'
    recurrence_interval: Mapped[int] = mapped_column(Integer, default=1, nullable=False) # e.g. every 2 weeks
    custom_cron: Mapped[str | None] = mapped_column(String(100), nullable=True) # cron string for Custom recurrences
    
    next_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) # Skip/Pause indicator

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", backref="recurring_tasks")
    assignee = relationship("User", backref="recurring_tasks")

class RecurringTaskHistory(Base):
    """
    Model recording the log history of recurring tasks generation or skipped runs.
    """
    __tablename__ = "recurring_task_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recurring_task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("recurring_tasks.id", ondelete="CASCADE"), nullable=False)
    generated_task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # 'Generated', 'Skipped'
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    recurring_task = relationship("RecurringTask", backref="history")
    generated_task = relationship("Task", backref="recurring_source")
