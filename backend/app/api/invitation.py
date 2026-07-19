import uuid
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceInvitation
from app.models.workspace_member import WorkspaceMember
from app.schemas.workspace import WorkspaceInvitationCreate, WorkspaceInvitationResponse
from app.models.activity import ActivityLog
from app.dependencies.rbac import PermissionChecker

router = APIRouter(prefix="/workspace/invitations", tags=["Workspace Invitations"])

@router.post("", response_model=WorkspaceInvitationResponse, status_code=status.HTTP_201_CREATED, summary="Invite a user to the workspace")
def invite_user(
    data: WorkspaceInvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    has_perm: bool = Depends(PermissionChecker("invite_members"))
):
    # Check if workspace exists
    workspace = db.query(Workspace).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="No workspace initialized yet.")

    # Check if target email is already a member
    user_target = db.query(User).filter(User.email == data.email.lower()).first()
    if user_target:
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user_target.id
        ).first()
        if member:
            raise HTTPException(status_code=400, detail="User is already a member of this workspace.")

    # Check if there is already a pending invitation for this email
    existing_invite = db.query(WorkspaceInvitation).filter(
        WorkspaceInvitation.workspace_id == workspace.id,
        WorkspaceInvitation.email == data.email.lower(),
        WorkspaceInvitation.status == "pending",
        WorkspaceInvitation.expires_at > datetime.utcnow()
    ).first()
    if existing_invite:
        raise HTTPException(status_code=400, detail="A pending invitation already exists for this email address.")

    # Generate secure invitation
    token = secrets.token_urlsafe(32)
    invitation = WorkspaceInvitation(
        workspace_id=workspace.id,
        email=data.email.lower(),
        role=data.role,
        token=token,
        invited_by_id=current_user.id,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )

    db.add(invitation)

    # Activity Log
    log = ActivityLog(
        user_id=current_user.id,
        action="Invite Created",
        details=f"Invited email {data.email} as role {data.role}."
    )
    db.add(log)
    db.commit()
    db.refresh(invitation)
    return invitation

@router.get("", response_model=List[WorkspaceInvitationResponse], summary="List all workspace invitations")
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invitations = db.query(WorkspaceInvitation).order_by(WorkspaceInvitation.created_at.desc()).all()
    # Dynamic status update if expired
    now = datetime.utcnow()
    for invite in invitations:
        if invite.status == "pending" and invite.expires_at < now:
            invite.status = "expired"
            db.commit()
    return invitations

@router.post("/{invitation_id}/resend", response_model=WorkspaceInvitationResponse, summary="Resend a workspace invitation")
def resend_invitation(
    invitation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(WorkspaceInvitation).filter(WorkspaceInvitation.id == invitation_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    # Refresh token and expiration
    invite.token = secrets.token_urlsafe(32)
    invite.status = "pending"
    invite.expires_at = datetime.utcnow() + timedelta(days=7)

    log = ActivityLog(
        user_id=current_user.id,
        action="Invite Resent",
        details=f"Resent invitation to email {invite.email}."
    )
    db.add(log)
    db.commit()
    db.refresh(invite)
    return invite

@router.post("/{invitation_id}/cancel", response_model=WorkspaceInvitationResponse, summary="Cancel an invitation")
def cancel_invitation(
    invitation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(WorkspaceInvitation).filter(WorkspaceInvitation.id == invitation_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    invite.status = "cancelled"

    log = ActivityLog(
        user_id=current_user.id,
        action="Invite Cancelled",
        details=f"Cancelled invitation to email {invite.email}."
    )
    db.add(log)
    db.commit()
    db.refresh(invite)
    return invite

@router.post("/accept", summary="Accept workspace invitation using token")
def accept_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(WorkspaceInvitation).filter(WorkspaceInvitation.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invitation token.")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation has already been {invite.status}.")

    if invite.expires_at < datetime.utcnow():
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invitation token has expired.")

    # Verify if email matches user email
    if invite.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=400, detail="Invitation email address mismatch.")

    # Check if already a member
    existing_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == invite.workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if not existing_member:
        member = WorkspaceMember(
            workspace_id=invite.workspace_id,
            user_id=current_user.id,
            role=invite.role
        )
        db.add(member)

    invite.status = "accepted"

    log = ActivityLog(
        user_id=current_user.id,
        action="Invite Accepted",
        details=f"User {current_user.full_name} accepted invite to workspace."
    )
    db.add(log)
    db.commit()
    return {"status": "success", "detail": "Invitation accepted successfully."}

@router.post("/reject", summary="Reject workspace invitation using token")
def reject_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(WorkspaceInvitation).filter(WorkspaceInvitation.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invitation token.")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation has already been {invite.status}.")

    invite.status = "rejected"

    log = ActivityLog(
        user_id=current_user.id,
        action="Invite Rejected",
        details=f"User rejected invitation to workspace."
    )
    db.add(log)
    db.commit()
    return {"status": "success", "detail": "Invitation rejected successfully."}
