import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentVersion
from app.models.activity import ActivityLog
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentVersionResponse

router = APIRouter(prefix="/documents", tags=["Documentation"])

@router.get(
    "",
    response_model=List[DocumentResponse],
    summary="List or search documents"
)
def get_documents(
    project_id: Optional[uuid.UUID] = None,
    parent_id: Optional[uuid.UUID] = None,
    is_favorite: Optional[bool] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all documentation pages.
    Supports filtering by project_id, parent_id, is_favorite, and full-text keyword queries.
    """
    query = db.query(Document)
    
    if project_id:
        query = query.filter(Document.project_id == project_id)
    if parent_id:
        query = query.filter(Document.parent_id == parent_id)
    if is_favorite is not None:
        query = query.filter(Document.is_favorite == is_favorite)
    if q:
        query = query.filter(
            Document.title.ilike(f"%{q}%") | Document.content.ilike(f"%{q}%")
        )
        
    return query.order_by(Document.updated_at.desc()).all()

@router.get(
    "/{id}",
    response_model=DocumentResponse,
    summary="Get single document"
)
def get_document(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches a single document by its UUID.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return doc

@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create document"
)
def create_document(
    doc_data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new documentation page and logs the activity.
    """
    doc = Document(
        title=doc_data.title or "Untitled Document",
        content=doc_data.content or "",
        project_id=doc_data.project_id,
        parent_id=doc_data.parent_id,
        owner_id=current_user.id
    )
    db.add(doc)
    
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Document Created",
        details=f"Created documentation page '{doc.title}'",
        target_type="Document",
        target_name=doc.title
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(doc)
    return doc

@router.patch(
    "/{id}",
    response_model=DocumentResponse,
    summary="Update document"
)
def update_document(
    id: uuid.UUID,
    doc_data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates document content, title, parent, or favorite flag.
    If the content is modified, it automatically saves a new snapshot inside Version History
    when the version is incremented.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    content_changed = False
    
    if doc_data.title is not None and doc_data.title != doc.title:
        doc.title = doc_data.title
    if doc_data.content is not None and doc_data.content != doc.content:
        # Create a version history snapshot of the *previous* state before replacing
        old_version = DocumentVersion(
            document_id=doc.id,
            version_number=doc.version,
            title=doc.title,
            content=doc.content,
            author_id=current_user.id
        )
        db.add(old_version)
        
        doc.content = doc_data.content
        doc.version += 1
        content_changed = True
        
    if doc_data.parent_id is not None:
        doc.parent_id = doc_data.parent_id
    if doc_data.is_favorite is not None:
        doc.is_favorite = doc_data.is_favorite
        
    doc.updated_at = datetime.utcnow()
    
    # Log activity
    if content_changed:
        db_log = ActivityLog(
            user_id=current_user.id,
            action="Document Updated",
            details=f"Updated content of document '{doc.title}' to version {doc.version}",
            target_type="Document",
            target_name=doc.title
        )
        db.add(db_log)
        
    db.commit()
    db.refresh(doc)
    return doc

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete document"
)
def delete_document(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permanently deletes a document page and all its nested children.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Document Deleted",
        details=f"Deleted documentation page '{doc.title}'",
        target_type="Document",
        target_name=doc.title
    )
    db.add(db_log)
    
    db.delete(doc)
    db.commit()
    return None

@router.get(
    "/{id}/versions",
    response_model=List[DocumentVersionResponse],
    summary="Get document versions"
)
def get_document_versions(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists the version history timeline for a document.
    """
    return db.query(DocumentVersion).filter(DocumentVersion.document_id == id).order_by(DocumentVersion.version_number.desc()).all()

@router.post(
    "/{id}/restore/{version_number}",
    response_model=DocumentResponse,
    summary="Restore document version"
)
def restore_document_version(
    id: uuid.UUID,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Restores the content of a document to a specific historical snapshot.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == id,
        DocumentVersion.version_number == version_number
    ).first()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version snapshot not found"
        )
        
    # Archive current state
    old_state = DocumentVersion(
        document_id=doc.id,
        version_number=doc.version,
        title=doc.title,
        content=doc.content,
        author_id=current_user.id
    )
    db.add(old_state)
    
    # Restore target state
    doc.title = version.title
    doc.content = version.content
    doc.version += 1
    doc.updated_at = datetime.utcnow()
    
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Document Restored",
        details=f"Restored document '{doc.title}' to version {version_number}",
        target_type="Document",
        target_name=doc.title
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(doc)
    return doc
