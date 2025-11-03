"""Authentication API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from merlin.api.deps import SessionDep
from merlin.core.security import create_access_token, hash_password, verify_password
from merlin.repositories.user_repo import UserRepository
from merlin.schemas.auth import Token, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_user_repository(session: SessionDep) -> UserRepository:
    """Dependency for user repository."""
    return UserRepository(session)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repository)]


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, user_repo: UserRepoDep) -> Token:
    """Register a new user account.

    Args:
        user_data: User registration data (email, password)
        user_repo: User repository dependency

    Returns:
        JWT access token and user information

    Raises:
        HTTPException: If email already exists
    """
    # Check if email already exists
    if await user_repo.email_exists(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user = await user_repo.create(
        email=user_data.email, hashed_password=hashed_password
    )

    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user.id),
        email=user.email,
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, user_repo: UserRepoDep) -> Token:
    """Login with email and password.

    Args:
        credentials: Login credentials (email, password)
        user_repo: User repository dependency

    Returns:
        JWT access token and user information

    Raises:
        HTTPException: If credentials are invalid
    """
    # Get user by email
    user = await user_repo.get_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user.id),
        email=user.email,
    )
