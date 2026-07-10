import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.saved_filter import SavedFilter
from app.schemas.saved_filter import (
    SavedFilterCreate,
    SavedFilterResponse
)

router = APIRouter(prefix="/saved-filters", tags=["Advanced Filters"])

@router.post(
    "",
    response_model=SavedFilterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a new filter preset"
)
def create_saved_filter(
    request: SavedFilterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved_filter = SavedFilter(
        user_id=current_user.id,
        name=request.name,
        target_type=request.target_type,
        criteria=request.criteria
    )
    db.add(saved_filter)
    db.commit()
    db.refresh(saved_filter)
    return saved_filter

@router.get(
    "",
    response_model=List[SavedFilterResponse],
    summary="List all user's saved filter presets"
)
def list_saved_filters(
    target_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SavedFilter).filter(SavedFilter.user_id == current_user.id)
    if target_type:
        query = query.filter(SavedFilter.target_type == target_type)
    return query.order_by(SavedFilter.name.asc()).all()

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a saved filter preset"
)
def delete_saved_filter(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved_filter = db.query(SavedFilter).filter(
        SavedFilter.id == id,
        SavedFilter.user_id == current_user.id
    ).first()
    
    if not saved_filter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved filter preset not found."
        )

    db.delete(saved_filter)
    db.commit()
    return None
