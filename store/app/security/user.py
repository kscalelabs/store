"""Defines security-related functions for authenticating users with given permissions."""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from store.app.db import Crud
from store.app.errors import ItemNotFoundError, NotAuthenticatedError
from store.app.model import User
from store.app.security.requests import get_request_api_key_id, maybe_get_request_api_key_id


async def get_session_user_with_permission(
    permission: str,
    crud: Crud,
    api_key_id: str,
) -> User:
    try:
        api_key = await crud.get_api_key(api_key_id)
        if api_key.permissions is None or permission not in api_key.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        return await crud.get_user(api_key.user_id, throw_if_missing=True)
    except ItemNotFoundError:
        raise NotAuthenticatedError("Not authenticated")


async def get_session_user_with_read_permission(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str, Depends(get_request_api_key_id)],
) -> User:
    return await get_session_user_with_permission("read", crud, api_key_id)


async def get_session_user_with_write_permission(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str, Depends(get_request_api_key_id)],
) -> User:
    return await get_session_user_with_permission("write", crud, api_key_id)


async def get_session_user_with_admin_permission(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str, Depends(get_request_api_key_id)],
) -> User:
    return await get_session_user_with_permission("admin", crud, api_key_id)


async def maybe_get_user_from_api_key(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str | None, Depends(maybe_get_request_api_key_id)],
) -> User | None:
    if api_key_id is None:
        return None
    api_key = await crud.get_api_key(api_key_id)
    return await crud.get_user(api_key.user_id, throw_if_missing=False)
