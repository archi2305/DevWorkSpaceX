from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token
from app.services.auth import AuthService
from app.core.security import create_access_token

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
    return AuthService.register_user(db, user_data)

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
    # Generate the access token using the user's UUID string as the payload subject
    access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out user",
    description="Acknowledges user logout. The client should clear the stored JWT."
)
def logout():
    """
    Client-side logout endpoint.
    """
    return {"message": "Logged out successfully"}
