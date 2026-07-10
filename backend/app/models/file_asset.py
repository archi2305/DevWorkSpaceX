import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref
from app.database.db import Base

class FileAsset(Base):
    """
    FileAsset database model representing uploaded files and folder structures.
    """
    __tablename__ = "file_assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(512), nullable=True) # Null for folders
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True) # Null for folders
    size: Mapped[int | None] = mapped_column(Integer, nullable=True)          # Null for folders
    is_folder: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Scoping
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True
    )
    
    # Supporting nested folders
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("file_assets.id", ondelete="CASCADE"),
        nullable=True
    )
    
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    project = relationship("Project", backref="file_assets")
    parent = relationship("FileAsset", remote_side=[id], backref=backref("children", cascade="all, delete-orphan"))
    owner = relationship("User", backref="file_assets")
