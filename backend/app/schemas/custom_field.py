import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class CustomFieldDefinitionCreate(BaseModel):
    name: str
    field_type: str # 'Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'URL'
    target_type: str # 'Project', 'Task'
    options: Optional[List[str]] = None

class CustomFieldDefinitionResponse(BaseModel):
    id: uuid.UUID
    name: str
    field_type: str
    target_type: str
    options: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomFieldValueSave(BaseModel):
    field_definition_id: uuid.UUID
    entity_id: uuid.UUID
    value: dict # JSON dict e.g. {"val": "High"} or {"val": 12} or {"val": true}

class CustomFieldValueResponse(BaseModel):
    id: uuid.UUID
    field_definition_id: uuid.UUID
    entity_id: uuid.UUID
    value: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
