import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.chat_channel import ChatChannel, ChannelMessage
from app.schemas.user import UserResponse

router = APIRouter(prefix="/chat", tags=["Chat & Messaging"])

# --- Schemas ---
class ChatChannelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1024)

class ChatChannelCreate(ChatChannelBase):
    pass

class ChatChannelResponse(ChatChannelBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ChannelMessageResponse(BaseModel):
    id: uuid.UUID
    channel_id: uuid.UUID
    user_id: uuid.UUID
    content: str
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/channels", response_model=List[ChatChannelResponse])
def get_channels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channels = db.query(ChatChannel).order_by(ChatChannel.name.asc()).all()
    
    # Auto-seed general channel if none exists
    if not channels:
        general_channel = ChatChannel(
            name="general",
            description="Company-wide announcements and work discussions"
        )
        db.add(general_channel)
        db.commit()
        db.refresh(general_channel)
        channels = [general_channel]

    return channels

@router.post("/channels", response_model=ChatChannelResponse, status_code=status.HTTP_201_CREATED)
def create_channel(
    channel_data: ChatChannelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if channel already exists
    existing = db.query(ChatChannel).filter(ChatChannel.name == channel_data.name.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A channel with this name already exists"
        )
    
    db_channel = ChatChannel(
        name=channel_data.name.lower().replace(" ", "-"),
        description=channel_data.description
    )
    db.add(db_channel)
    db.commit()
    db.refresh(db_channel)
    return db_channel

@router.get("/channels/{channel_id}/messages", response_model=List[ChannelMessageResponse])
def get_channel_messages(
    channel_id: uuid.UUID,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channel = db.query(ChatChannel).filter(ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    messages = db.query(ChannelMessage)\
        .filter(ChannelMessage.channel_id == channel_id)\
        .order_by(ChannelMessage.created_at.asc())\
        .limit(limit)\
        .all()
    return messages
