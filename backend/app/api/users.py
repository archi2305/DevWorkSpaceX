from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the profile information of the currently authenticated user based on the provided JWT access token."
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the database model instance of the authenticated user.
    """
    return current_user
