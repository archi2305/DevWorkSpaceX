import uuid
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database.db import Base

class FAQ(Base):
    __tablename__ = "faqs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    question: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        unique=True
    )
    answer: Mapped[str] = mapped_column(
        String(2048),
        nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(100),
        default="General",
        nullable=False
    )
