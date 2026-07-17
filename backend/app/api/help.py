import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.support_ticket import SupportTicket
from app.models.faq import FAQ

router = APIRouter(prefix="/help", tags=["Help & Support"])

# --- Schemas ---
class SupportTicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10, max_length=2048)
    category: str = Field("General", max_length=100)
    priority: str = Field("Medium", max_length=50)

class SupportTicketResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FAQResponse(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    category: str

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/faqs", response_model=List[FAQResponse])
def get_faqs(db: Session = Depends(get_db)):
    faqs = db.query(FAQ).all()
    if not faqs:
        seed_faqs = [
            FAQ(
                question="How do I configure git triggers?",
                answer="Go to Integration Settings, select the GitHub provider, authorize access, and link a repository.",
                category="Git Integration"
            ),
            FAQ(
                question="What formats can I export my workspace data in?",
                answer="You can export in JSON, CSV, Excel, Markdown, and full ZIP format from the /workspace route.",
                category="Workspace Data"
            ),
            FAQ(
                question="How do I configure custom task workflows?",
                answer="Custom task columns can be adjusted within each project's settings tab. You can add, rename, or delete columns.",
                category="Task Management"
            ),
            FAQ(
                question="Can I configure automatic database backups?",
                answer="Yes, backup triggers are managed under the Automations panel where you can setup schedule routines.",
                category="Automations & Backup"
            )
        ]
        db.add_all(seed_faqs)
        db.commit()
        faqs = db.query(FAQ).all()
    return faqs

@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    ticket_data: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = SupportTicket(
        user_id=current_user.id,
        title=ticket_data.title,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/tickets", response_model=List[SupportTicketResponse])
def get_support_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tickets = db.query(SupportTicket)\
        .filter(SupportTicket.user_id == current_user.id)\
        .order_by(SupportTicket.created_at.desc())\
        .all()
    return tickets
