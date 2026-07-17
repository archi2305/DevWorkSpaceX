from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token
from app.services.auth import AuthService
from app.core.security import create_access_token
from app.models.activity import ActivityLog
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user in the system with their full name, email, and password."
)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user, hashes their password, and saves them to the database.
    """
    user = AuthService.register_user(db, user_data)
    # Log registration activity
    db_log = ActivityLog(
        user_id=user.id,
        category="login",
        event_type="create",
        action="User Registration",
        details=f"User {user.full_name} registered successfully",
        target_type="User",
        target_name=user.full_name,
        target_id=user.id
    )
    db.add(db_log)
    db.commit()
    return user

from fastapi.security import OAuth2PasswordRequestForm

@router.post(
    "/token",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="OAuth2 compatible token login",
    description="Authenticates credentials from standard OAuth2 form-data and returns a JWT access token."
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    login_data = UserLogin(email=form_data.username, password=form_data.password)
    user = AuthService.authenticate_user(db, login_data)
    access_token = create_access_token(subject=str(user.id))
    
    # Log login activity
    db_log = ActivityLog(
        user_id=user.id,
        category="login",
        event_type="login",
        action="OAuth2 Login",
        details=f"User {user.full_name} logged in via OAuth2 token endpoint",
        target_type="User",
        target_name=user.full_name,
        target_id=user.id
    )
    db.add(db_log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Log in user",
    description="Authenticates credentials and returns a JWT access token."
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates user credentials and generates a JWT bearer token.
    """
    user = AuthService.authenticate_user(db, login_data)
    access_token = create_access_token(subject=str(user.id))
    
    # Log login activity
    db_log = ActivityLog(
        user_id=user.id,
        category="login",
        event_type="login",
        action="User Login",
        details=f"User {user.full_name} logged in",
        target_type="User",
        target_name=user.full_name,
        target_id=user.id
    )
    db.add(db_log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

from app.dependencies.auth import oauth2_scheme
from app.models.token_blacklist import BlacklistedToken
from datetime import datetime, timedelta

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out user",
    description="Acknowledges user logout. The client should clear the stored JWT."
)
def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme)
):
    """
    Client-side logout endpoint. Logs logout activity on the database.
    """
    # Blacklist the current token
    # Access tokens expire in 1 day by default
    blacklist_entry = BlacklistedToken(
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=1)
    )
    db.add(blacklist_entry)

    # Log logout activity
    db_log = ActivityLog(
        user_id=current_user.id,
        category="login",
        event_type="logout",
        action="User Logout",
        details=f"User {current_user.full_name} logged out",
        target_type="User",
        target_name=current_user.full_name,
        target_id=current_user.id
    )
    db.add(db_log)
    db.commit()
    
    return {"message": "Logged out successfully"}
