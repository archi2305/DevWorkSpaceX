import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue
from app.schemas.custom_field import (
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionResponse,
    CustomFieldValueSave,
    CustomFieldValueResponse
)

router = APIRouter(prefix="/custom-fields", tags=["Custom Fields"])

@router.post("/definitions", response_model=CustomFieldDefinitionResponse, status_code=status.HTTP_201_CREATED, summary="Create a new custom field definition")
def create_definition(
    request: CustomFieldDefinitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    definition = CustomFieldDefinition(
        name=request.name,
        field_type=request.field_type,
        target_type=request.target_type,
        options=request.options
    )
    db.add(definition)
    db.commit()
    db.refresh(definition)
    return definition

@router.get("/definitions", response_model=List[CustomFieldDefinitionResponse], summary="List custom field definitions")
def list_definitions(
    target_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CustomFieldDefinition)
    if target_type:
        query = query.filter(CustomFieldDefinition.target_type == target_type)
    return query.order_by(CustomFieldDefinition.name.asc()).all()

@router.delete("/definitions/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete custom field definition")
def delete_definition(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    definition = db.query(CustomFieldDefinition).filter(CustomFieldDefinition.id == id).first()
    if not definition:
        raise HTTPException(status_code=404, detail="Custom field definition not found")
    db.delete(definition)
    db.commit()
    return None

@router.post("/values", response_model=CustomFieldValueResponse, summary="Save or update a custom field value")
def save_custom_field_value(
    request: CustomFieldValueSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify definition exists
    definition = db.query(CustomFieldDefinition).filter(CustomFieldDefinition.id == request.field_definition_id).first()
    if not definition:
        raise HTTPException(status_code=404, detail="Custom field definition not found")

    # Check for existing value mapping
    val_record = db.query(CustomFieldValue).filter(
        CustomFieldValue.field_definition_id == request.field_definition_id,
        CustomFieldValue.entity_id == request.entity_id
    ).first()

    if val_record:
        val_record.value = request.value
    else:
        val_record = CustomFieldValue(
            field_definition_id=request.field_definition_id,
            entity_id=request.entity_id,
            value=request.value
        )
        db.add(val_record)

    db.commit()
    db.refresh(val_record)
    return val_record

@router.get("/values/{entity_id}", response_model=List[CustomFieldValueResponse], summary="List all custom field values for a Project or Task")
def get_custom_field_values(
    entity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(CustomFieldValue).filter(CustomFieldValue.entity_id == entity_id).all()
