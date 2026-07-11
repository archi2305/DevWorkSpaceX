import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class WorkspaceMember(Base):
    """
    WorkspaceMember model mapping users to roles inside the workspace.
    Roles: Owner, Admin, Manager, Developer, Designer, Viewer
    """
    __tablename__ = "workspace_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(nullable=False, default=uuid.uuid4)
    role: Mapped[str] = mapped_column(String(50), default="Developer", nullable=False)
    weekly_capacity_hours: Mapped[int] = mapped_column(nullable=False, default=40)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="workspace_memberships")
