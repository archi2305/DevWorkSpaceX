import os
import uuid
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.file_asset import FileAsset
from app.models.activity import ActivityLog
from app.schemas.file_asset import FileAssetResponse, FileAssetCreateFolder, FileAssetUpdate

router = APIRouter(prefix="/files", tags=["File Management"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get(
    "",
    response_model=List[FileAssetResponse],
    summary="List files and folders"
)
def get_files(
    project_id: Optional[uuid.UUID] = None,
    parent_id: Optional[uuid.UUID] = None,
    q: Optional[str] = None,
    sort_by: Optional[str] = "newest", # name, newest, size
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List files and folders. Supports scoping by project, parent folder, and searches.
    """
    query = db.query(FileAsset)
    
    if project_id:
        query = query.filter(FileAsset.project_id == project_id)
    if parent_id:
        query = query.filter(FileAsset.parent_id == parent_id)
    else:
        # If no parent_id filter is specified, only return root assets (parent_id is null)
        # except when doing a full text search query.
        if not q:
            query = query.filter(FileAsset.parent_id == None)
            
    if q:
        query = query.filter(FileAsset.name.ilike(f"%{q}%"))
        
    # Sort
    if sort_by == "name":
        query = query.order_by(FileAsset.is_folder.desc(), FileAsset.name.asc())
    elif sort_by == "size":
        query = query.order_by(FileAsset.is_folder.desc(), FileAsset.size.desc())
    else: # newest
        query = query.order_by(FileAsset.is_folder.desc(), FileAsset.created_at.desc())
        
    return query.all()

@router.post(
    "/upload",
    response_model=FileAssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload file"
)
def upload_file(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    parent_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file, saving it locally. This architecture is S3-swappable.
    """
    # Parse UUIDs from forms
    proj_uuid = uuid.UUID(project_id) if project_id else None
    parent_uuid = uuid.UUID(parent_id) if parent_id else None
    
    # Generate unique local filename
    unique_suffix = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_suffix)
    
    # Save file contents
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )
        
    # Read size
    size_in_bytes = os.path.getsize(file_path)
    
    # Create DB entry
    db_file = FileAsset(
        name=file.filename or "Unnamed File",
        file_path=file_path,
        mime_type=file.content_type or "application/octet-stream",
        size=size_in_bytes,
        is_folder=False,
        project_id=proj_uuid,
        parent_id=parent_uuid,
        owner_id=current_user.id
    )
    db.add(db_file)
    
    # Log Activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="File Uploaded",
        details=f"Uploaded file '{db_file.name}' ({size_in_bytes} bytes)",
        target_type="File",
        target_name=db_file.name
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(db_file)
    return db_file

@router.post(
    "/folder",
    response_model=FileAssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create folder"
)
def create_folder(
    folder_data: FileAssetCreateFolder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a virtual folder inside the workspace.
    """
    db_folder = FileAsset(
        name=folder_data.name,
        is_folder=True,
        project_id=folder_data.project_id,
        parent_id=folder_data.parent_id,
        owner_id=current_user.id
    )
    db.add(db_folder)
    
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Folder Created",
        details=f"Created directory '{db_folder.name}'",
        target_type="Folder",
        target_name=db_folder.name
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.patch(
    "/{id}",
    response_model=FileAssetResponse,
    summary="Rename file or folder"
)
def rename_asset(
    id: uuid.UUID,
    data: FileAssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Renames a file asset or folder.
    """
    asset = db.query(FileAsset).filter(FileAsset.id == id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File or Folder not found"
        )
        
    old_name = asset.name
    asset.name = data.name
    asset.updated_at = datetime.utcnow()
    
    db_log = ActivityLog(
        user_id=current_user.id,
        action="File Renamed",
        details=f"Renamed '{old_name}' to '{data.name}'",
        target_type="File",
        target_name=data.name
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(asset)
    return asset

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete file or folder"
)
def delete_asset(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes file metadata, removes it from disk (if a file), and deletes any children (cascade).
    """
    asset = db.query(FileAsset).filter(FileAsset.id == id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File or Folder not found"
        )
        
    # Helper recursive function to delete actual files from local storage
    def delete_local_file(node: FileAsset):
        if not node.is_folder and node.file_path and os.path.exists(node.file_path):
            try:
                os.remove(node.file_path)
            except Exception:
                pass
        for child in node.children:
            delete_local_file(child)
            
    # Remove files from local disk
    delete_local_file(asset)
    
    db_log = ActivityLog(
        user_id=current_user.id,
        action="File Deleted",
        details=f"Deleted file/folder '{asset.name}'",
        target_type="File",
        target_name=asset.name
    )
    db.add(db_log)
    
    db.delete(asset)
    db.commit()
    return None

@router.get(
    "/download/{id}",
    summary="Download or Stream file content"
)
def download_file(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a file asset. Serves files directly using FastAPI FileResponse.
    """
    asset = db.query(FileAsset).filter(FileAsset.id == id).first()
    if not asset or asset.is_folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
        
    if not asset.file_path or not os.path.exists(asset.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )
        
    return FileResponse(
        path=asset.file_path,
        media_type=asset.mime_type or "application/octet-stream",
        filename=asset.name
    )
