from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.user_preference import UserPreferenceResponse, UserPreferenceUpdate

router = APIRouter(prefix="/users/me/preferences", tags=["User Preferences"])

@router.get("", response_model=UserPreferenceResponse, summary="Get user-specific UI & notification settings")
def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        # Auto-create defaults
        prefs = UserPreference(
            user_id=current_user.id,
            theme="System",
            accent_color="#5BB98C",
            keyboard_shortcuts_enabled=True,
            email_notifications=True,
            in_app_notifications=True,
            language="en"
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs

@router.put("", response_model=UserPreferenceResponse, summary="Update user-specific settings")
def update_user_preferences(
    request: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreference(user_id=current_user.id)
        db.add(prefs)

    if request.theme is not None:
        prefs.theme = request.theme
    if request.accent_color is not None:
        prefs.accent_color = request.accent_color
    if request.keyboard_shortcuts_enabled is not None:
        prefs.keyboard_shortcuts_enabled = request.keyboard_shortcuts_enabled
    if request.email_notifications is not None:
        prefs.email_notifications = request.email_notifications
    if request.in_app_notifications is not None:
        prefs.in_app_notifications = request.in_app_notifications
    if request.language is not None:
        prefs.language = request.language

    db.commit()
    db.refresh(prefs)
    return prefs
