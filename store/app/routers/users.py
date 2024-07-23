"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
from email.utils import parseaddr as parse_email_address
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.security.utils import get_authorization_scheme_param
from httpx import AsyncClient
from pydantic.main import BaseModel as PydanticBaseModel

from store.app.crypto import new_token
from store.app.db import Crud
from store.app.model import UserPermissions
from store.app.utils.email import send_delete_email
from store.settings import settings

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


async def get_session_token(request: Request) -> str:
    token = request.cookies.get("session_token")
    if not token:
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
    return token


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
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserInfoResponse | None:
    try:
        user = await crud.get_user_from_token(token)
        return UserInfoResponse(
            id=user.id,
            permissions=user.permissions,
        )
    except ValueError:
        return None


@users_router.delete("/me")
async def delete_user_endpoint(
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user = await crud.get_user_from_token(token)
    await crud.delete_user(user.id)
    await send_delete_email(user.email)
    return True


@users_router.delete("/logout")
async def logout_user_endpoint(
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
    response: Response,
) -> bool:
    await crud.delete_api_key(token)
    response.delete_cookie("session_token")
    return True


class PublicUserInfoResponse(BaseModel):
    id: str


@users_router.get("/batch", response_model=list[PublicUserInfoResponse])
async def get_users_batch_endpoint(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(...),
) -> list[PublicUserInfoResponse]:
    user_objs = await crud.get_user_batch(ids)
    return [PublicUserInfoResponse(id=user_obj.id) for user_obj in user_objs]


@users_router.get("/github-login")
async def github_login() -> str:
    """Gives the user a redirect url to login with github.

    Returns:
        Github oauth redirect url.
    """
    return f"https://github.com/login/oauth/authorize?scope=user:email&client_id={settings.oauth.github_client_id}"


@users_router.get("/github-code/{code}", response_model=UserInfoResponse)
async def github_code(
    code: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    response: Response,
) -> UserInfoResponse:
    """Gives the user a session token upon successful github authentication and creation of user.

    Args:
        code: Github code returned from the successful authentication.
        crud: The CRUD object.
        response: The response object.

    Returns:
        UserInfoResponse.
    """
    params = {
        "client_id": settings.oauth.github_client_id,
        "client_secret": settings.oauth.github_client_secret,
        "code": code,
    }
    headers = {"Accept": "application/json"}
    async with AsyncClient() as client:
        oauth_response = await client.post(
            url="https://github.com/login/oauth/access_token",
            params=params,
            headers=headers,
        )
    response_json = oauth_response.json()

    # access token is used to retrieve user oauth details
    access_token = response_json["access_token"]
    async with AsyncClient() as client:
        headers.update({"Authorization": f"Bearer {access_token}"})
        print(access_token)
        oauth_response = await client.get("https://api.github.com/user", headers=headers)
        oauth_email_response = await client.get("https://api.github.com/user/emails", headers=headers)

    github_id = oauth_response.json()["html_url"]
    email = None
    for entry in oauth_email_response.json():
        if entry["primary"] == True:
            email = entry["email"]

    user = await crud.get_user_from_github_token(github_id)
    # Exception occurs when user does not exist.
    # Create a user if this is the case.
    if user == None:
        user = await crud.create_user_from_github_token(
            email=email,
            github_id=github_id,
        )

    token = new_token()

    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
    )

    return UserInfoResponse(id=user.id, permissions=user.permissions)


@users_router.get("/{id}", response_model=PublicUserInfoResponse)
async def get_user_info_by_id_endpoint(id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> PublicUserInfoResponse:
    user_obj = await crud.get_user(id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return PublicUserInfoResponse(id=user_obj.id)
