"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
from email.utils import parseaddr as parse_email_address
from typing import Annotated, Literal, overload

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security.utils import get_authorization_scheme_param
from pydantic.main import BaseModel as PydanticBaseModel

from store.app.crud.base import ItemNotFoundError
from store.app.db import Crud
from store.app.errors import NotAuthenticatedError
from store.app.model import User, UserPermission
from store.app.routers.auth.github import github_auth_router
from store.app.utils.email import send_delete_email

logger = logging.getLogger(__name__)

users_router = APIRouter()

TOKEN_TYPE = "Bearer"


class BaseModel(PydanticBaseModel):
    class Config:
        arbitrary_types_allowed = True


@overload
async def _get_request_api_key_id_base(request: Request, require_header: Literal[True]) -> str: ...


@overload
async def _get_request_api_key_id_base(request: Request, require_header: Literal[False]) -> str | None: ...


async def _get_request_api_key_id_base(request: Request, require_header: bool) -> str | None:
    authorization = request.headers.get("Authorization") or request.headers.get("authorization")
    if not authorization:
        if require_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        return None
    scheme, credentials = get_authorization_scheme_param(authorization)
    if not (scheme and credentials):
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Authorization header is invalid",
        )
    if scheme.lower() != TOKEN_TYPE.lower():
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Authorization scheme is invalid",
        )
    return credentials


async def get_request_api_key_id(request: Request) -> str:
    return await _get_request_api_key_id_base(request, True)


async def maybe_get_request_api_key_id(request: Request) -> str | None:
    return await _get_request_api_key_id_base(request, False)


async def get_session_user_with_read_permission(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str, Depends(get_request_api_key_id)],
) -> User:
    try:
        api_key = await crud.get_api_key(api_key_id)
        if api_key.permissions is None or "read" not in api_key.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        try:
            return await crud.get_user(api_key.user_id, throw_if_missing=True)
        except ItemNotFoundError:
            raise NotAuthenticatedError("Not authenticated")
    except ItemNotFoundError:
        raise NotAuthenticatedError("Not authenticated")


async def get_session_user_with_write_permission(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str, Depends(get_request_api_key_id)],
) -> User:
    try:
        api_key = await crud.get_api_key(api_key_id)
        if api_key.permissions is None or "write" not in api_key.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        return await crud.get_user(api_key.user_id, throw_if_missing=True)
    except ItemNotFoundError:
        raise NotAuthenticatedError("Not authenticated")


async def get_session_user_with_admin_permission(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str, Depends(get_request_api_key_id)],
) -> User:
    try:
        api_key = await crud.get_api_key(api_key_id)
        if api_key.permissions is None or "admin" not in api_key.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        return await crud.get_user(api_key.user_id, throw_if_missing=True)
    except ItemNotFoundError:
        raise NotAuthenticatedError("Not authenticated")


async def maybe_get_user_from_api_key(
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_id: Annotated[str | None, Depends(maybe_get_request_api_key_id)],
) -> User | None:
    if api_key_id is None:
        return None
    api_key = await crud.get_api_key(api_key_id)
    return await crud.get_user(api_key.user_id, throw_if_missing=False)


def validate_email(email: str) -> str:
    try:
        email = parse_email_address(email)[1]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    return email


class SendRegister(BaseModel):
    email: str


class UserRegister(BaseModel):
    token: str


class UserInfoResponse(BaseModel):
    user_id: str
    permissions: set[UserPermission] | None


@users_router.get("/me", response_model=UserInfoResponse)
async def get_user_info_endpoint(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> UserInfoResponse | None:
    try:
        return UserInfoResponse(
            user_id=user.id,
            permissions=user.permissions,
        )
    except ValueError:
        return None


@users_router.delete("/me")
async def delete_user_endpoint(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    await crud.delete_user(user.id)
    await send_delete_email(user.email)
    return True


@users_router.delete("/logout")
async def logout_user_endpoint(
    token: Annotated[str, Depends(get_request_api_key_id)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    await crud.delete_api_key(token)
    return True


class SinglePublicUserInfoResponseItem(BaseModel):
    id: str
    email: str


class PublicUserInfoResponse(BaseModel):
    users: list[SinglePublicUserInfoResponseItem]


@users_router.get("/batch", response_model=PublicUserInfoResponse)
async def get_users_batch_endpoint(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(...),
) -> PublicUserInfoResponse:
    users = await crud.get_user_batch(ids)
    return PublicUserInfoResponse(
        users=[SinglePublicUserInfoResponseItem(id=user.id, email=user.email) for user in users]
    )


@users_router.get("/{id}", response_model=SinglePublicUserInfoResponseItem)
async def get_user_info_by_id_endpoint(
    id: str, crud: Annotated[Crud, Depends(Crud.get)]
) -> SinglePublicUserInfoResponseItem:
    user = await crud.get_user(id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return SinglePublicUserInfoResponseItem(id=user.id, email=user.email)


users_router.include_router(github_auth_router, prefix="/github")
