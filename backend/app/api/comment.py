import uuid
import re
import os
from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File
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
    CommentReplyCreate,
    ReactionCreate,
    ReactionResponse
)

router = APIRouter(tags=["Comments & Discussions"])

# Configure upload directory
UPLOAD_DIR = "uploads/attachments"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def parse_mentions(content: str) -> List[str]:
    """Parse @mentions from content and return list of user IDs"""
    # Pattern to match @username format
    pattern = r'@(\w+)'
    mentions = re.findall(pattern, content)
    return mentions

def parse_markdown(content: str) -> str:
    """Basic markdown parsing for comments"""
    # This is a simple implementation - in production use a proper markdown library
    markdown = content
    # Convert bold
    markdown = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', markdown)
    # Convert italic
    markdown = re.sub(r'\*(.*?)\*', r'<em>\1</em>', markdown)
    # Convert code
    markdown = re.sub(r'`(.*?)`', r'<code>\1</code>', markdown)
    # Convert links
    markdown = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', markdown)
    return markdown

@router.post(
    "/upload-attachment",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Upload attachment for comments"
)
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a file attachment for use in comments.
    """
    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.zip'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    # Return file metadata
    return {
        "filename": file.filename,
        "url": f"/uploads/attachments/{unique_filename}",
        "size": len(content),
        "type": file.content_type
    }

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
    request: CommentCreate,
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
    
    # Parse mentions and markdown
    mentions = request.mentions or parse_mentions(request.content)
    content_markdown = request.content_markdown or parse_markdown(request.content)
    
    db_comment = Comment(
        content=request.content,
        content_markdown=content_markdown,
        task_id=task_id,
        user_id=current_user.id,
        mentions=mentions,
        attachments=request.attachments
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
    
    # Notify task assignee if it's not the comment creator
    if task.assignee_id and task.assignee_id != current_user.id:
        dispatch_notification(
            db=db,
            user_id=task.assignee_id,
            title="Comment Added",
            message=f"{current_user.full_name} commented on task '{task.title}': {db_comment.content[:60]}",
            notification_type="Mention"
        )
    
    # Notify mentioned users
    for mention in mentions:
        # Find user by username (simplified - in production use proper user lookup)
        mentioned_user = db.query(User).filter(User.email.ilike(f"%{mention}%")).first()
        if mentioned_user and mentioned_user.id != current_user.id:
            dispatch_notification(
                db=db,
                user_id=mentioned_user.id,
                title="You were mentioned",
                message=f"{current_user.full_name} mentioned you in a comment on task '{task.title}'",
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
    request: CommentCreate,
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
    
    # Parse mentions and markdown
    mentions = request.mentions or parse_mentions(request.content)
    content_markdown = request.content_markdown or parse_markdown(request.content)
    
    db_comment = Comment(
        content=request.content,
        content_markdown=content_markdown,
        project_id=project_id,
        user_id=current_user.id,
        mentions=mentions,
        attachments=request.attachments
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
    
    # Notify mentioned users
    for mention in mentions:
        mentioned_user = db.query(User).filter(User.email.ilike(f"%{mention}%")).first()
        if mentioned_user and mentioned_user.id != current_user.id:
            dispatch_notification(
                db=db,
                user_id=mentioned_user.id,
                title="You were mentioned",
                message=f"{current_user.full_name} mentioned you in a discussion on project '{project.name}'",
                notification_type="Mention"
            )
    
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
    comment.content_markdown = request.content_markdown or parse_markdown(request.content)
    comment.mentions = request.mentions or parse_mentions(request.content)
    comment.attachments = request.attachments
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
    
    # Parse mentions and markdown
    mentions = request.mentions or parse_mentions(request.content)
    content_markdown = request.content_markdown or parse_markdown(request.content)
    
    db_reply = CommentReply(
        comment_id=comment_id,
        user_id=current_user.id,
        content=request.content,
        content_markdown=content_markdown,
        mentions=mentions,
        attachments=request.attachments
    )
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    
    # Notify parent comment author if they are not the reply author
    if comment.user_id != current_user.id:
        dispatch_notification(
            db=db,
            user_id=comment.user_id,
            title="Comment Replied",
            message=f"{current_user.full_name} replied: {db_reply.content[:60]}",
            notification_type="Mention"
        )
    
    # Notify mentioned users
    for mention in mentions:
        mentioned_user = db.query(User).filter(User.email.ilike(f"%{mention}%")).first()
        if mentioned_user and mentioned_user.id != current_user.id:
            dispatch_notification(
                db=db,
                user_id=mentioned_user.id,
                title="You were mentioned",
                message=f"{current_user.full_name} mentioned you in a reply",
                notification_type="Mention"
            )
        
    return db_reply

@router.post(
    "/comments/{comment_id}/reactions",
    response_model=ReactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add emoji reaction to comment"
)
def add_comment_reaction(
    comment_id: uuid.UUID,
    request: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adds or removes an emoji reaction to a comment.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found."
        )
    
    # Initialize reactions dict if None
    if comment.reactions is None:
        comment.reactions = {}
    
    # Get current user ID as string
    user_id_str = str(current_user.id)
    
    # Check if user already reacted with this emoji
    if request.emoji in comment.reactions:
        if user_id_str in comment.reactions[request.emoji]:
            # Remove reaction
            comment.reactions[request.emoji].remove(user_id_str)
            if not comment.reactions[request.emoji]:
                del comment.reactions[request.emoji]
        else:
            # Add reaction
            comment.reactions[request.emoji].append(user_id_str)
    else:
        # Add new emoji reaction
        comment.reactions[request.emoji] = [user_id_str]
    
    db.commit()
    db.refresh(comment)
    
    # Return reaction info
    user_ids = comment.reactions.get(request.emoji, [])
    return ReactionResponse(
        emoji=request.emoji,
        user_ids=user_ids,
        count=len(user_ids)
    )

@router.post(
    "/replies/{reply_id}/reactions",
    response_model=ReactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add emoji reaction to reply"
)
def add_reply_reaction(
    reply_id: uuid.UUID,
    request: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adds or removes an emoji reaction to a reply.
    """
    reply = db.query(CommentReply).filter(CommentReply.id == reply_id).first()
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found."
        )
    
    # Initialize reactions dict if None
    if reply.reactions is None:
        reply.reactions = {}
    
    # Get current user ID as string
    user_id_str = str(current_user.id)
    
    # Check if user already reacted with this emoji
    if request.emoji in reply.reactions:
        if user_id_str in reply.reactions[request.emoji]:
            # Remove reaction
            reply.reactions[request.emoji].remove(user_id_str)
            if not reply.reactions[request.emoji]:
                del reply.reactions[request.emoji]
        else:
            # Add reaction
            reply.reactions[request.emoji].append(user_id_str)
    else:
        # Add new emoji reaction
        reply.reactions[request.emoji] = [user_id_str]
    
    db.commit()
    db.refresh(reply)
    
    # Return reaction info
    user_ids = reply.reactions.get(request.emoji, [])
    return ReactionResponse(
        emoji=request.emoji,
        user_ids=user_ids,
        count=len(user_ids)
    )
