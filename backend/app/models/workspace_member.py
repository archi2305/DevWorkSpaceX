import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class WorkspaceMember(Base):
    """
    WorkspaceMember model representing workspace team collaborators.
    """
    __tablename__ = "workspace_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    # Collaborative status (e.g. 'Active', 'Away', 'Offline')
    status: Mapped[str] = mapped_column(
        String(50),
        default="Offline",
        nullable=False
    )

    # Workspace Role (e.g. 'Product Manager', 'Designer', 'Software Engineer')
    role: Mapped[str] = mapped_column(
        String(100),
        default="Developer",
        nullable=False
    )

    # Activity tracker
    last_active: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationship to user details
    user = relationship("User", backref="workspace_member_profile")
