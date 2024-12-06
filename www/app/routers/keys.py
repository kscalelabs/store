"""Defines the API endpoint for creating, deleting and updating user information."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from www.app.db import Crud
from www.app.model import User
from www.app.security.cognito import get_current_user

router = APIRouter()


class KeysResponseItem(BaseModel):
    """Response model for API key information."""

    token: str
    permissions: str


class NewKeyResponse(BaseModel):
    """Response model for new API key creation."""

    user_id: str
    key: KeysResponseItem


@router.post("/create", response_model=NewKeyResponse)
async def create_key(
    user: Annotated[User, Depends(get_current_user)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> NewKeyResponse:
    """Create a new API key for the authenticated user."""
    try:
        api_key, raw_key = await crud.add_api_key(
            user_id=user.id,
            source="cognito",
            permissions="full",
        )
        return NewKeyResponse(
            user_id=user.id,
            key=KeysResponseItem(token=raw_key, permissions=api_key.permissions),
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
