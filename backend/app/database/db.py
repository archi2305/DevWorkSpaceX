from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

# SQLAlchemy 2.0 DeclarativeBase class
class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy database models.
    """
    pass

# Create the database engine
# pool_pre_ping=True automatically tests connections before using them, preventing stale connection errors
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Create a session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
