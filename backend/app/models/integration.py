import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class Integration(Base):
    """
    Model representing third-party workspace integrations (GitHub, Slack, Discord, Google Calendar, Webhooks).
    """
    __tablename__ = "integrations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    provider: Mapped[str] = mapped_column(String(100), nullable=False) # 'GitHub', 'Slack', 'Discord', 'Google Calendar', 'Webhook'
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False) # 'Active', 'Disabled'
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True) # Webhook URLs, OAuth tokens, calendars

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", backref="integrations")
