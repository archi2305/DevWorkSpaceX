import uuid
from datetime import datetime
from sqlalchemy import String, JSON, ForeignKey, DateTime, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base

class CustomFieldDefinition(Base):
    """
    Model representing dynamic Custom Field definitions created by Admins.
    """
    __tablename__ = "custom_field_definitions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    field_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'URL'
    target_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'Project', 'Task'
    options: Mapped[list | None] = mapped_column(JSON, nullable=True) # Dropdown values e.g. ["Option A", "Option B"]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class CustomFieldValue(Base):
    """
    Model storing user values for a specific Custom Field definition applied to a Project or Task.
    """
    __tablename__ = "custom_field_values"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    field_definition_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("custom_field_definitions.id", ondelete="CASCADE"), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True) # ID of Project or Task
    value: Mapped[dict | None] = mapped_column(JSON, nullable=True) # Actual value stored as JSON (e.g. {"val": "Confidence Level A"})

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    field_definition = relationship("CustomFieldDefinition", backref="values")
