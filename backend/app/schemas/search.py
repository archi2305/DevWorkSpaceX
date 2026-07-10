import uuid
from typing import List, Optional
from pydantic import BaseModel

class SearchProject(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class SearchTask(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: str
    priority: str

    class Config:
        from_attributes = True

class SearchMember(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class SearchDocument(BaseModel):
    id: uuid.UUID
    title: str
    content: Optional[str] = None

    class Config:
        from_attributes = True

class SearchComment(BaseModel):
    id: uuid.UUID
    content: str
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True

class SearchFile(BaseModel):
    id: uuid.UUID
    name: str
    file_type: str
    size: int

    class Config:
        from_attributes = True

class GlobalSearchResponse(BaseModel):
    projects: List[SearchProject]
    tasks: List[SearchTask]
    members: List[SearchMember]
    documents: List[SearchDocument]
    comments: List[SearchComment]
    files: List[SearchFile]
