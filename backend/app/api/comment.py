import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.comment import Comment, CommentReply
from app.models.activity import ActivityLog
from app.api.notification import dispatch_notification
from app.schemas.comment import (
    CommentResponse,
    CommentCreate,
    CommentUpdate,
    CommentReplyResponse,
    CommentReplyCreate
)

router = APIRouter(tags=["Comments & Discussions"])

@router.get(
    "/tasks/{task_id}/comments",
    response_model=List[CommentResponse],
    summary="Get comments for a task"
)
def get_task_comments(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves comments and nested replies left on a specific task.
    """
    return db.query(Comment).filter(Comment.task_id == task_id).order_by(Comment.created_at.asc()).all()

@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add comment to a task"
)
def add_task_comment(
    task_id: uuid.UUID,
    request: CommentReplyCreate, # content only
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a task comment, logs activity, and sends notifications.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    db_comment = Comment(
        content=request.content,
        task_id=task_id,
        user_id=current_user.id
    )
    db.add(db_comment)
    
    # Log comment activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Comment Added",
        details=f"{current_user.full_name} commented on task '{task.title}'",
        target_type="Task",
        target_name=task.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_comment)
    
    # Notify task assignee if it's not the comment creator!
    if task.assignee_id and task.assignee_id != current_user.id:
        dispatch_notification(
            db=db,
            user_id=task.assignee_id,
            title="Comment Added",
            message=f"{current_user.full_name} commented on task '{task.title}': {db_comment.content[:60]}",
            notification_type="Mention"
        )
        
    return db_comment

@router.get(
    "/projects/{project_id}/discussions",
    response_model=List[CommentResponse],
    summary="Get project discussions"
)
def get_project_discussions(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves discussion threads left directly on a project.
    """
    return db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.task_id == None
    ).order_by(Comment.created_at.asc()).all()

@router.post(
    "/projects/{project_id}/discussions",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post project discussion comment"
)
def add_project_discussion(
    project_id: uuid.UUID,
    request: CommentReplyCreate, # content only
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a project discussion post and logs activity.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    db_comment = Comment(
        content=request.content,
        project_id=project_id,
        user_id=current_user.id
    )
    db.add(db_comment)
    
    # Log comment activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Comment Added",
        details=f"{current_user.full_name} posted discussion on project '{project.name}'",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.patch(
    "/comments/{id}",
    response_model=CommentResponse,
    summary="Edit comment"
)
def edit_comment(
    id: uuid.UUID,
    request: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the text content of a comment.
    """
    comment = db.query(Comment).filter(
        Comment.id == id,
        Comment.user_id == current_user.id
    ).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or unauthorized to modify."
        )
    comment.content = request.content
    db.commit()
    db.refresh(comment)
    return comment

@router.delete(
    "/comments/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete comment"
)
def delete_comment(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a comment and cascade purges replies.
    """
    comment = db.query(Comment).filter(
        Comment.id == id,
        Comment.user_id == current_user.id
    ).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or unauthorized to delete."
        )
    db.delete(comment)
    db.commit()
    return None

@router.post(
    "/comments/{comment_id}/reply",
    response_model=CommentReplyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Reply to comment"
)
def reply_to_comment(
    comment_id: uuid.UUID,
    request: CommentReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adds a nested reply to an existing comment thread.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent comment not found."
        )
        
    db_reply = CommentReply(
        comment_id=comment_id,
        user_id=current_user.id,
        content=request.content
    )
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    
    # Notify parent comment author if they are not the reply author!
    if comment.user_id != current_user.id:
        dispatch_notification(
            db=db,
            user_id=comment.user_id,
            title="Comment Replied",
            message=f"{current_user.full_name} replied: {db_reply.content[:60]}",
            notification_type="Mention"
        )
        
    return db_reply
