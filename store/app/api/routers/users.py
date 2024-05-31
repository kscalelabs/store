"""Defines the API endpoint for creating, deleting and updating user information."""

import datetime
import logging
import uuid
from email.utils import parseaddr as parse_email_address
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security.utils import get_authorization_scheme_param
from pydantic.main import BaseModel

from store.app.api.db import Crud
from store.app.api.email import OneTimePassPayload, send_delete_email, send_otp_email
from store.app.api.model import User
from store.app.api.token import create_refresh_token, create_token, load_refresh_token, load_token
from store.settings import settings

logger = logging.getLogger(__name__)

users_router = APIRouter()

REFRESH_TOKEN_COOKIE_KEY = "__REFRESH_TOKEN"
SESSION_TOKEN_COOKIE_KEY = "__SESSION_TOKEN"

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


class RefreshTokenData(BaseModel):
    user_id: str
    token_id: str

    @classmethod
    async def encode(cls, user: User, crud: Crud) -> str:
        return await create_refresh_token(user.user_id, crud)

    @classmethod
    def decode(cls, payload: str) -> "RefreshTokenData":
        user_id, token_id = load_refresh_token(payload)
        return cls(user_id=user_id, token_id=token_id)


class SessionTokenData(BaseModel):
    user_id: str
    token_id: str

    def encode(self) -> str:
        expire_minutes = settings.crypto.expire_token_minutes
        expire_after = datetime.timedelta(minutes=expire_minutes)
        return create_token({"uid": self.user_id, "tid": self.token_id}, expire_after=expire_after, extra="session")

    @classmethod
    def decode(cls, payload: str) -> "SessionTokenData":
        data = load_token(payload, extra="session")
        return cls(user_id=data["uid"], token_id=data["tid"])


class UserSignup(BaseModel):
    email: str
    login_url: str


def validate_email(email: str) -> str:
    try:
        email = parse_email_address(email)[1]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    return email


def get_new_user_id() -> str:
    return str(uuid.uuid4())


@users_router.post("/login")
async def login_user_endpoint(data: UserSignup) -> bool:
    email = validate_email(data.email)
    payload = OneTimePassPayload(email)
    await send_otp_email(payload, data.login_url)
    return True


class OneTimePass(BaseModel):
    payload: str


class UserLoginResponse(BaseModel):
    token: str
    token_type: str


async def create_or_get(email: str, crud: Crud) -> User:
    # Gets or creates the user object.
    user_obj = await crud.get_user_from_email(email)
    if user_obj is None:
        await crud.add_user(User(user_id=get_new_user_id(), email=email))
        if (user_obj := await crud.get_user_from_email(email)) is None:
            raise RuntimeError("Failed to add user to the database")
    return user_obj


async def get_login_response(
    response: Response,
    user_obj: User,
    crud: Crud,
) -> UserLoginResponse:
    refresh_token = await RefreshTokenData.encode(user_obj, crud)
    set_token_cookie(response, refresh_token, REFRESH_TOKEN_COOKIE_KEY)
    return UserLoginResponse(token=refresh_token, token_type=TOKEN_TYPE)


@users_router.post("/otp", response_model=UserLoginResponse)
async def otp_endpoint(
    data: OneTimePass,
    response: Response,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserLoginResponse:
    payload = OneTimePassPayload.decode(data.payload)
    user_obj = await create_or_get(payload.email, crud)
    return await get_login_response(response, user_obj, crud)


class GoogleLogin(BaseModel):
    token: str


async def get_google_user_info(token: str) -> dict:
    async with aiohttp.ClientSession() as session:
        response = await session.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            params={"access_token": token},
        )
        if response.status != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
        return await response.json()


@users_router.post("/google")
async def google_login_endpoint(
    data: GoogleLogin,
    response: Response,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserLoginResponse:
    try:
        idinfo = await get_google_user_info(data.token)
        email = idinfo["email"]
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
    if idinfo.get("email_verified") is not True:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google email not verified")
    user_obj = await create_or_get(email, crud)
    return await get_login_response(response, user_obj, crud)


async def get_refresh_token(request: Request) -> RefreshTokenData:
    # Tries Authorization header.
    authorization = request.headers.get("Authorization")
    if authorization:
        scheme, credentials = get_authorization_scheme_param(authorization)
        if not (scheme and credentials):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if scheme.lower() != TOKEN_TYPE.lower():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return RefreshTokenData.decode(credentials)

    # Tries Cookie.
    cookie_token = request.cookies.get(REFRESH_TOKEN_COOKIE_KEY)
    if cookie_token:
        return RefreshTokenData.decode(cookie_token)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


async def get_session_token(request: Request) -> SessionTokenData:
    # Tries Authorization header.
    authorization = request.headers.get("Authorization") or request.headers.get("authorization")
    if authorization:
        scheme, credentials = get_authorization_scheme_param(authorization)
        if not (scheme and credentials):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if scheme.lower() != TOKEN_TYPE.lower():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return SessionTokenData.decode(credentials)

    # Tries Cookie.
    cookie_token = request.cookies.get(SESSION_TOKEN_COOKIE_KEY)
    if cookie_token:
        return SessionTokenData.decode(cookie_token)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


class UserInfoResponse(BaseModel):
    email: str


@users_router.get("/me", response_model=UserInfoResponse)
async def get_user_info_endpoint(
    data: Annotated[SessionTokenData, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserInfoResponse:
    user_obj = await crud.get_user(data.user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    return UserInfoResponse(email=user_obj.email)


@users_router.delete("/me")
async def delete_user_endpoint(
    data: Annotated[SessionTokenData, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_obj = await crud.get_user(data.user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    await crud.delete_user(user_obj)
    await send_delete_email(user_obj.email)
    return True


@users_router.delete("/logout")
async def logout_user_endpoint(
    response: Response,
    data: Annotated[SessionTokenData, Depends(get_session_token)],
) -> bool:
    response.delete_cookie(key=SESSION_TOKEN_COOKIE_KEY)
    response.delete_cookie(key=REFRESH_TOKEN_COOKIE_KEY)
    return True


class RefreshTokenResponse(BaseModel):
    token: str
    token_type: str


@users_router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_endpoint(
    response: Response,
    data: Annotated[RefreshTokenData, Depends(get_refresh_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> RefreshTokenResponse:
    token = await crud.get_token(data.token_id)
    if token is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    session_token = SessionTokenData(user_id=data.user_id, token_id=data.token_id).encode()
    set_token_cookie(response, session_token, SESSION_TOKEN_COOKIE_KEY)
    return RefreshTokenResponse(token=session_token, token_type=TOKEN_TYPE)
