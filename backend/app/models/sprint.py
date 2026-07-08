import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.db import Base

class Sprint(Base):
    """
    SQLAlchemy database model representing active sprint metadata.
    """
    __tablename__ = "sprints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Sprint name (e.g. 'Sprint 24')
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Sprint period boundary timestamps
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Target velocity and progress tracking metrics
    completed_tasks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tasks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    velocity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Creation timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
