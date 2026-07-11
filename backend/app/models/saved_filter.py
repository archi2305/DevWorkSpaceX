import uuid
from datetime import datetime
from sqlalchemy import String, JSON, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class SavedFilter(Base):
    """
    Model representing user-saved filter criteria presets for projects and tasks.
    """
    __tablename__ = "saved_filters"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'Project', 'Task'
    criteria: Mapped[dict] = mapped_column(JSON, nullable=False) # Serializable JSON filter arguments
    layout: Mapped[str | None] = mapped_column(String(50), nullable=True) # 'kanban', 'table', 'list'
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="saved_filters")
