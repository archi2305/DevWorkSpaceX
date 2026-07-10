import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.label import Label
from app.models.task import Task
from app.schemas.label import (
    LabelCreate,
    LabelUpdate,
    LabelResponse
)

router = APIRouter(prefix="/labels", tags=["Labels & Tags"])

@router.post(
    "",
    response_model=LabelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new label"
)
def create_label(
    request: LabelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    label = Label(
        project_id=request.project_id,
        name=request.name,
        color=request.color
    )
    db.add(label)
    db.commit()
    db.refresh(label)
    return label

@router.get(
    "",
    response_model=List[LabelResponse],
    summary="List all labels or search"
)
def list_labels(
    project_id: Optional[uuid.UUID] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Label)
    if project_id:
        query = query.filter(Label.project_id == project_id)
    if q:
        query = query.filter(Label.name.ilike(f"%{q}%"))
    return query.order_by(Label.name.asc()).all()

@router.patch(
    "/{id}",
    response_model=LabelResponse,
    summary="Update a label details"
)
def update_label(
    id: uuid.UUID,
    request: LabelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    label = db.query(Label).filter(Label.id == id).first()
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found."
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(label, key, value)

    db.commit()
    db.refresh(label)
    return label

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a label"
)
def delete_label(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    label = db.query(Label).filter(Label.id == id).first()
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found."
        )

    db.delete(label)
    db.commit()
    return None

@router.post(
    "/tasks/{task_id}",
    summary="Assign multiple labels to a task"
)
def assign_labels_to_task(
    task_id: uuid.UUID,
    label_ids: List[uuid.UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    labels = db.query(Label).filter(Label.id.in_(label_ids)).all()
    task.labels = labels
    db.commit()
    return {"message": f"Successfully assigned {len(labels)} labels to task."}

@router.delete(
    "/tasks/{task_id}/{label_id}",
    summary="Remove a label from a task"
)
def remove_label_from_task(
    task_id: uuid.UUID,
    label_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found."
        )

    if label in task.labels:
        task.labels.remove(label)
        db.commit()

    return {"message": "Label unassigned successfully."}
