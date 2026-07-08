from typing import Generator
from sqlalchemy.orm import Session
from app.database.db import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    Dependency generator that creates a new database session for a request,
    yields it, and closes it once the request has completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
