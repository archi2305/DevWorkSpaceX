import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class Workspace(Base):
    """
    Model storing general workspace settings, theme parameters, and permissions.
    """
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), default="My Workspace", nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    theme: Mapped[str] = mapped_column(String(50), default="dark", nullable=False)
    accent_color: Mapped[str] = mapped_column(String(50), default="#5BB98C", nullable=False)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC", nullable=False)
    allow_member_invites: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enable_email_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enable_desktop_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class APIKey(Base):
    """
    Model representing workspace developer API tokens.
    """
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(16), nullable=False)
    token: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class UserSession(Base):
    """
    Model representing active user security login sessions.
    """
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_agent: Mapped[str] = mapped_column(String(500), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(100), nullable=False)
    last_active: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class ConnectedAccount(Base):
    """
    Model representing integrated OAuth credentials (GitHub, Slack).
    """
    __tablename__ = "connected_accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False) # 'github' or 'slack'
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    connected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class WorkspaceInvitation(Base):
    """
    Model representing secure pending workspace user invites.
    """
    __tablename__ = "workspace_invitations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False) # Owner, Admin, Developer, Viewer
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    invited_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False) # pending, accepted, rejected, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
