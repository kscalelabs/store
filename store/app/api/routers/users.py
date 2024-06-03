"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
import uuid
from email.utils import parseaddr as parse_email_address
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security.utils import get_authorization_scheme_param
from pydantic.main import BaseModel

from store.app.api.crypto import get_new_api_key, get_new_user_id
from store.app.api.db import Crud
from store.app.api.email import OneTimePassPayload, send_delete_email, send_otp_email
from store.app.api.model import User

logger = logging.getLogger(__name__)

users_router = APIRouter()

TOKEN_TYPE = "Bearer"


def set_token_cookie(response: Response, token: str, key: str) -> None:
    response.set_cookie(
        key=key,
        value=token,
        httponly=True,
        secure=False,
        # samesite="strict",
        samesite="none",
    )


class ApiKeyData(BaseModel):
    api_key: uuid.UUID


async def get_api_key(request: Request) -> ApiKeyData:
    # Tries Authorization header.
    authorization = request.headers.get("Authorization") or request.headers.get("authorization")
    if authorization:
        scheme, credentials = get_authorization_scheme_param(authorization)
        if not (scheme and credentials):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if scheme.lower() != TOKEN_TYPE.lower():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return ApiKeyData(api_key=uuid.UUID(credentials))

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


class UserSignup(BaseModel):
    email: str
    login_url: str
    lifetime: int


def validate_email(email: str) -> str:
    try:
        email = parse_email_address(email)[1]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    return email


@users_router.post("/login")
async def login_user_endpoint(data: UserSignup) -> bool:
    """Takes the user email and sends them a one-time login password.

    Args:
        data: The payload with the user email and the login URL to redirect to
            when the user logs in.

    Returns:
        True if the email was sent successfully.
    """
    email = validate_email(data.email)
    payload = OneTimePassPayload(email, lifetime=data.lifetime)
    await send_otp_email(payload, data.login_url)
    return True


class OneTimePass(BaseModel):
    payload: str


class UserLoginResponse(BaseModel):
    api_key: str


async def get_login_response(email: str, lifetime: int, crud: Crud) -> UserLoginResponse:
    """Takes the user email and returns an API key.

    This function gets a user API key for an email which has been validated,
    either through an OTP or through Google OAuth.

    Args:
        email: The validated email of the user.
        crud: The database CRUD object.

    Returns:
        The API key for the user.
    """
    # If the user doesn't exist, then create a new user.
    user_obj = await crud.get_user_from_email(email)
    if user_obj is None:
        await crud.add_user(User(user_id=str(get_new_user_id()), email=email))
        if (user_obj := await crud.get_user_from_email(email)) is None:
            raise RuntimeError("Failed to add user to the database")

    # Issue a new API key for the user.
    user_id: uuid.UUID = user_obj.to_uuid()
    api_key: uuid.UUID = get_new_api_key(user_id)
    await crud.add_api_key(api_key, user_id, lifetime)

    return UserLoginResponse(api_key=str(api_key))


@users_router.post("/otp", response_model=UserLoginResponse)
async def otp_endpoint(
    data: OneTimePass,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserLoginResponse:
    """Takes the one-time password and returns an API key.

    Args:
        data: The one-time password payload.
        crud: The database CRUD object.

    Returns:
        The API key if the one-time password is valid.
    """
    payload = OneTimePassPayload.decode(data.payload)
    return await get_login_response(payload.email, payload.lifetime, crud)


async def get_google_user_info(token: str) -> dict:
    async with aiohttp.ClientSession() as session:
        response = await session.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            params={"access_token": token},
        )
        if response.status != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
        return await response.json()


class GoogleLogin(BaseModel):
    token: str  # This is the token that Google gives us for authenticated users.


@users_router.post("/google")
async def google_login_endpoint(
    data: GoogleLogin,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserLoginResponse:
    try:
        idinfo = await get_google_user_info(data.token)
        email = idinfo["email"]
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
    if idinfo.get("email_verified") is not True:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google email not verified")

    return await get_login_response(email, crud)


class UserInfoResponse(BaseModel):
    email: str


@users_router.get("/me", response_model=UserInfoResponse)
async def get_user_info_endpoint(
    data: Annotated[ApiKeyData, Depends(get_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserInfoResponse:
    user_id = await crud.get_user_id_from_api_key(data.api_key)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user_obj = await crud.get_user(user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserInfoResponse(email=user_obj.email)


@users_router.delete("/me")
async def delete_user_endpoint(
    data: Annotated[ApiKeyData, Depends(get_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_api_key(data.api_key)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user_obj = await crud.get_user(user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await crud.delete_user(user_obj)
    await send_delete_email(user_obj.email)
    return True


@users_router.delete("/logout")
async def logout_user_endpoint(
    data: Annotated[ApiKeyData, Depends(get_api_key)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    await crud.delete_api_key(data.api_key)
    return True
