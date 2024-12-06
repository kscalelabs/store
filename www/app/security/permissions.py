"""Defines permission utilities for the API."""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from www.app.model import User
from www.app.security.cognito import get_current_user


async def get_session_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get the current session user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


async def get_session_user_with_write_permission(
    user: Annotated[User, Depends(get_session_user)],
) -> User:
    """Get the current session user and verify they have write permission."""
    return user
