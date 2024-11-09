"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic.main import BaseModel

from store.app.db import Crud
from store.app.model import APIKeyPermission, User
from store.app.security.user import get_session_user_with_admin_permission

logger = logging.getLogger(__name__)

router = APIRouter()

TOKEN_TYPE = "Bearer"


class KeysResponseItem(BaseModel):
    token: str
    permissions: set[APIKeyPermission] | None


class NewKeyRequest(BaseModel):
    readonly: bool = True


class NewKeyResponse(BaseModel):
    user_id: str
    key: KeysResponseItem


@router.post("/new", response_model=NewKeyResponse)
async def new_key(
    data: NewKeyRequest,
    user: Annotated[User, Depends(get_session_user_with_admin_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> NewKeyResponse:
    api_key = await crud.add_api_key(
        user_id=user.id,
        source="user",
        permissions={"read"} if data.readonly else {"read", "write"},
    )
    return NewKeyResponse(
        user_id=user.id,
        key=KeysResponseItem(token=api_key.id, permissions=api_key.permissions),
    )


class ListKeysResponse(BaseModel):
    keys: list[KeysResponseItem]


@router.get("/list", response_model=ListKeysResponse)
async def list_keys(
    user: Annotated[User, Depends(get_session_user_with_admin_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> ListKeysResponse:
    keys = await crud.list_api_keys(user.id)
    return ListKeysResponse(
        keys=[
            KeysResponseItem(
                token=key.id,
                permissions=key.permissions,
            )
            for key in keys
        ]
    )


@router.delete("/delete/{key}")
async def delete_key(
    key: str,
    user: Annotated[User, Depends(get_session_user_with_admin_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    await crud.delete_api_key(key)
