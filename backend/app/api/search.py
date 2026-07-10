from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.document import Document
from app.models.comment import Comment
from app.models.file_asset import FileAsset
from app.schemas.search import GlobalSearchResponse

router = APIRouter(prefix="/search", tags=["Search"])

@router.get(
    "",
    response_model=GlobalSearchResponse,
    summary="Global Workspace Search",
    description="Searches projects, tasks, workspace members, documents, comment feeds, and uploaded files matching a search query."
)
def search_workspace(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Query database records matching query term.
    """
    search_term = f"%{q}%"

    # 1. Projects search: project name or description matching query
    projects = db.query(Project).filter(
        ((Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id))) &
        (or_(Project.name.ilike(search_term), Project.description.ilike(search_term)))
    ).limit(10).all()

    # 2. Tasks search: task title or description matching query
    tasks = db.query(Task).join(Project).filter(
        ((Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id))) &
        (or_(Task.title.ilike(search_term), Task.description.ilike(search_term)))
    ).limit(20).all()

    # 3. Members search: user name or email matching query
    members = db.query(User).filter(
        or_(User.full_name.ilike(search_term), User.email.ilike(search_term))
    ).limit(10).all()

    # 4. Documents search: document title or content matching query
    documents = db.query(Document).filter(
        (Document.owner_id == current_user.id) &
        (or_(Document.title.ilike(search_term), Document.content.ilike(search_term)))
    ).limit(10).all()

    # 5. Comments search: comment body content matching query
    comments = db.query(Comment).filter(
        (Comment.user_id == current_user.id) &
        (Comment.content.ilike(search_term))
    ).limit(15).all()

    # 6. Files search: uploaded file asset name matching query
    files = db.query(FileAsset).filter(
        (FileAsset.owner_id == current_user.id) &
        (FileAsset.name.ilike(search_term))
    ).limit(15).all()

    return {
        "projects": projects,
        "tasks": tasks,
        "members": members,
        "documents": documents,
        "comments": comments,
        "files": files
    }
