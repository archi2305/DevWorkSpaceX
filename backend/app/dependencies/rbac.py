from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceMember, RolePermission

# Default fallbacks in case database isn't fully seeded
DEFAULT_ROLE_PERMISSIONS = {
    "Owner": [
        "create_project", "delete_project", "edit_project", "create_sprint",
        "invite_members", "delete_workspace", "edit_documentation", "manage_files",
        "create_api_keys"
    ],
    "Admin": [
        "create_project", "edit_project", "create_sprint", "invite_members",
        "edit_documentation", "manage_files", "create_api_keys"
    ],
    "Manager": [
        "create_project", "edit_project", "create_sprint",
        "edit_documentation", "manage_files"
    ],
    "Developer": [
        "edit_project", "edit_documentation", "manage_files"
    ],
    "Viewer": []
}

def seed_default_permissions(db: Session):
    """
    Seeds database with default permissions if empty.
    """
    count = db.query(RolePermission).count()
    if count == 0:
        for role, perms in DEFAULT_ROLE_PERMISSIONS.items():
            for perm in perms:
                db.add(RolePermission(role=role, permission=perm))
        db.commit()

class PermissionChecker:
    def __init__(self, permission: str):
        self.permission = permission

    def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Auto-seed if needed
        seed_default_permissions(db)

        # Get user's role in the workspace
        member = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a member of any active workspace."
            )

        # Owners have superuser access to all paths
        if member.role == "Owner":
            return True

        # Query database-driven RolePermission
        has_perm = db.query(RolePermission).filter(
            RolePermission.role == member.role,
            RolePermission.permission == self.permission
        ).first()

        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{member.role}' does not have '{self.permission}' permission."
            )
        return True
