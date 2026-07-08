from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    """
    Service class grouping authentication business logic operations.
    """

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Retrieve a user record from the database by email address.
        """
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> User:
        """
        Verify uniqueness, hash password, and insert a new User record.
        """
        # Ensure email is not already taken
        existing_user = AuthService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Secure the user password
        hashed_password = get_password_hash(user_data.password)
        
        # Instantiate model
        db_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            password_hash=hashed_password,
            profile_image=user_data.profile_image,
            is_active=True
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> User:
        """
        Validate login credentials. Returns the User record if successful.
        """
        # Find user
        user = AuthService.get_user_by_email(db, login_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Validate password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Ensure account is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated"
            )
            
        return user
