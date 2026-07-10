import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project, project_members
from app.models.workspace_member import WorkspaceMember
from app.models.task import Task
from app.models.activity import ActivityLog
from app.schemas.team import WorkspaceInvite, WorkspaceMemberUpdate, WorkspaceMemberResponse, ProjectMemberAdd
from app.api.notification import dispatch_notification

router = APIRouter(prefix="/workspace", tags=["Team Members"])

@router.get(
    "/members",
    response_model=List[WorkspaceMemberResponse],
    summary="Get all workspace members",
    description="Loads all team members registered in this workspace."
)
def get_workspace_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all workspace members.
    """
    # Ensure querying user is registered as a member
    current_membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).first()
    if not current_membership:
        # Assign Owner if it is the first member, otherwise Developer
        has_any = db.query(WorkspaceMember).first()
        role = "Owner" if not has_any else "Developer"
        current_membership = WorkspaceMember(
            user_id=current_user.id,
            role=role
        )
        db.add(current_membership)
        db.commit()
        db.refresh(current_membership)
        
    return db.query(WorkspaceMember).all()

@router.post(
    "/invite",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a new member",
    description="Invites a new member by email, auto-registering a profile if unregistered."
)
def invite_workspace_member(
    invite_data: WorkspaceInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Invites a user to the workspace. If the email doesn't exist, a placeholder user is created.
    """
    # Check if user already exists
    user = db.query(User).filter(User.email == invite_data.email).first()
    if not user:
        # Create placeholder user
        user = User(
            email=invite_data.email,
            full_name=invite_data.full_name,
            password_hash="invited_placeholder_no_password" # password reset on login
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Check if already a member
    existing_membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this workspace"
        )
        
    member = WorkspaceMember(
        user_id=user.id,
        role=invite_data.role
    )
    db.add(member)
    
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Member Invited",
        details=f"Invited '{invite_data.full_name}' as {invite_data.role}",
        target_type="Team",
        target_name=invite_data.full_name
    )
    db.add(db_log)
    db.commit()
    db.refresh(member)
    
    # Dispatch notification
    dispatch_notification(
        db=db,
        user_id=user.id,
        title="Workspace Invitation",
        message=f"You have been invited to join the workspace as a {member.role}.",
        notification_type="Info"
    )
    
    return member

@router.patch(
    "/member/{id}",
    response_model=WorkspaceMemberResponse,
    summary="Update member role",
    description="Modifies a member's role (Owner, Admin, Manager, etc.) inside the workspace."
)
def update_member_role(
    id: uuid.UUID,
    role_data: WorkspaceMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the role of a workspace member.
    """
    member = db.query(WorkspaceMember).filter(WorkspaceMember.id == id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace member not found"
        )
        
    old_role = member.role
    member.role = role_data.role
    
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Member Role Updated",
        details=f"Updated role of '{member.user.full_name}' from {old_role} to {role_data.role}",
        target_type="Team",
        target_name=member.user.full_name
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(member)
    return member

@router.delete(
    "/member/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove workspace member",
    description="Removes a member from the workspace."
)
def remove_workspace_member(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a member from the workspace.
    """
    member = db.query(WorkspaceMember).filter(WorkspaceMember.id == id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace member not found"
        )
        
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Member Removed",
        details=f"Removed '{member.user.full_name}' from workspace",
        target_type="Team",
        target_name=member.user.full_name
    )
    db.add(db_log)
    
    db.delete(member)
    db.commit()
    return None

# Project Member assignment routes
@router.post(
    "/projects/{id}/members",
    status_code=status.HTTP_200_OK,
    summary="Assign member to project",
    description="Adds a workspace user to a specific project members list."
)
def assign_project_member(
    id: uuid.UUID,
    member_data: ProjectMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assigns a member to a project.
    """
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Check if already in project members
    if user in project.members:
         raise HTTPException(
             status_code=status.HTTP_409_CONFLICT,
             detail="User is already a member of this project"
         )
         
    project.members.append(user)
    
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Member Added",
        details=f"Added '{user.full_name}' to project '{project.name}'",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    
    db.commit()
    return {"message": f"Successfully added {user.full_name} to project"}

@router.delete(
    "/projects/{id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove member from project",
    description="Removes a member from a project."
)
def remove_project_member(
    id: uuid.UUID,
    member_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a member from a project.
    """
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    user = db.query(User).filter(User.id == member_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user not in project.members:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="User is not a member of this project"
         )
         
    project.members.remove(user)
    
    # Log activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Member Removed",
        details=f"Removed '{user.full_name}' from project '{project.name}'",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    
    db.commit()
    return None

@router.get(
    "/member/{id}/profile",
    summary="Get member profile details"
)
def get_member_profile(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns complete profile details for a workspace member including their assigned projects, tasks, and recent activity logs.
    """
    member = db.query(WorkspaceMember).filter(WorkspaceMember.id == id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace member not found"
        )
        
    user = member.user
    
    # Load assigned projects where user is member or owner
    projects = db.query(Project).filter(
        (Project.owner_id == user.id) | (Project.members.any(id=user.id))
    ).all()
    
    # Load active tasks assigned to user
    tasks = db.query(Task).filter(Task.assignee_id == user.id).all()
    
    # Load recent activity logs of this user
    activities = db.query(ActivityLog).filter(ActivityLog.user_id == user.id).order_by(ActivityLog.created_at.desc()).limit(10).all()
    
    return {
        "member_id": str(member.id),
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": member.role,
        "joined_at": member.created_at,
        "projects_count": len(projects),
        "tasks_count": len(tasks),
        "recent_activities": [
            {
                "id": str(act.id),
                "action": act.action,
                "details": act.details,
                "created_at": act.created_at
            }
            for act in activities
        ],
        "assigned_projects": [
            {"id": str(p.id), "name": p.name}
            for p in projects
        ]
    }

@router.get(
    "/permissions",
    summary="Get roles permission matrix"
)
def get_workspace_permissions(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the workspace role permissions map matrix.
    """
    return {
        "Owner": {
            "manage_workspace": True,
            "invite_members": True,
            "create_projects": True,
            "delete_projects": True,
            "delete_workspace": True
        },
        "Admin": {
            "manage_workspace": True,
            "invite_members": True,
            "create_projects": True,
            "delete_projects": False,
            "delete_workspace": False
        },
        "Manager": {
            "manage_workspace": False,
            "invite_members": True,
            "create_projects": True,
            "delete_projects": False,
            "delete_workspace": False
        },
        "Developer": {
            "manage_workspace": False,
            "invite_members": False,
            "create_projects": True,
            "delete_projects": False,
            "delete_workspace": False
        },
        "Guest": {
            "manage_workspace": False,
            "invite_members": False,
            "create_projects": False,
            "delete_projects": False,
            "delete_workspace": False
        }
    }

