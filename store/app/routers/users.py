"""Defines the API endpoint for creating, deleting and updating user information."""

import functools
import logging
from email.utils import parseaddr as parse_email_address
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.security.utils import get_authorization_scheme_param
from pydantic.main import BaseModel as PydanticBaseModel

from store.app.db import Crud
from store.app.model import APIKeyPermission, User, UserPermissions
from store.app.routers.auth.github import github_auth_router
from store.app.utils.email import send_delete_email

logger = logging.getLogger(__name__)

users_router = APIRouter()

TOKEN_TYPE = "Bearer"


class BaseModel(PydanticBaseModel):
    class Config:
        arbitrary_types_allowed = True


def set_token_cookie(response: Response, token: str, key: str) -> None:
    response.set_cookie(
        key=key,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
    )


async def get_api_key_jwt(request: Request) -> str:
    api_key_jwt = request.cookies.get("session_token")
    if not api_key_jwt:
        authorization = request.headers.get("Authorization") or request.headers.get("authorization")
        if authorization:
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return api_key_jwt


async def get_session_user_with_permission(
    permission: APIKeyPermission,
    crud: Annotated[Crud, Depends(Crud.get)],
    api_key_jwt: Annotated[str, Depends(get_api_key_jwt)],
) -> User:
    api_key = await crud.get_api_key(api_key_jwt=api_key_jwt)
    if permission not in api_key.permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    user = await crud.get_user(api_key.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


get_session_user_with_read_permission = functools.partial(get_session_user_with_permission, permission="read")
get_session_user_with_write_permission = functools.partial(get_session_user_with_permission, permission="write")
get_session_user_with_admin_permission = functools.partial(get_session_user_with_permission, permission="admin")


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
    id: str
    permissions: UserPermissions


@users_router.get("/me", response_model=UserInfoResponse)
async def get_user_info_endpoint(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserInfoResponse | None:
    try:
        return UserInfoResponse(
            id=user.id,
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
    token: Annotated[str, Depends(get_api_key_jwt)],
    crud: Annotated[Crud, Depends(Crud.get)],
    response: Response,
) -> bool:
    await crud.delete_api_key(token)
    response.delete_cookie("session_token")
    return True


class PublicUserInfoResponse(BaseModel):
    id: str
    email: str


@users_router.get("/batch", response_model=list[PublicUserInfoResponse])
async def get_users_batch_endpoint(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(...),
) -> list[PublicUserInfoResponse]:
    users = await crud.get_user_batch(ids)
    return [PublicUserInfoResponse(id=user.id, email=user.email) for user in users]


@users_router.get("/{id}", response_model=PublicUserInfoResponse)
async def get_user_info_by_id_endpoint(id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> PublicUserInfoResponse:
    user = await crud.get_user(id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return PublicUserInfoResponse(id=user.id, email=user.email)


users_router.include_router(github_auth_router, prefix="/github", tags=["github"])
