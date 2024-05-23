"""Defines the API endpoint for creating, deleting and updating user information."""

import asyncio
import datetime
import logging
from email.utils import parseaddr as parse_email_address

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security.utils import get_authorization_scheme_param
from pydantic.main import BaseModel

from store.app.api.email import OneTimePassPayload, send_delete_email, send_otp_email, send_waitlist_email
from store.app.api.model import Token, User
from store.app.api.token import create_refresh_token, create_token, load_refresh_token, load_token
from store.settings import settings

logger = logging.getLogger(__name__)

api_router = APIRouter()

REFRESH_TOKEN_COOKIE_KEY = "__ROBOLIST_REFRESH_TOKEN"
SESSION_TOKEN_COOKIE_KEY = "__ROBOLIST_SESSION_TOKEN"

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
    user_id: int
    token_id: int

    @classmethod
    async def encode(cls, user: User) -> str:
        return await create_refresh_token(user)

    @classmethod
    def decode(cls, payload: str) -> "RefreshTokenData":
        user_id, token_id = load_refresh_token(payload)
        return cls(user_id=user_id, token_id=token_id)


class SessionTokenData(BaseModel):
    user_id: int

    def encode(self) -> str:
        expire_minutes = settings.crypto.expire_token_minutes
        expire_after = datetime.timedelta(minutes=expire_minutes)
        return create_token({"uid": self.user_id}, expire_after=expire_after)

    @classmethod
    def decode(cls, payload: str) -> "SessionTokenData":
        data = load_token(payload)
        return cls(user_id=data["uid"])


class UserSignup(BaseModel):
    email: str
    login_url: str


def validate_email(email: str) -> str:
    try:
        email = parse_email_address(email)[1]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    return email


@api_router.post("/login")
async def login_user(data: UserSignup) -> bool:
    email = validate_email(data.email)
    payload = OneTimePassPayload(email)

    if (
        settings.debug
        and (authorized_emails := settings.user.authorized_users) is not None
        and email in authorized_emails
    ):
        logger.warning("Login URL: %s?otp=%s", data.login_url, payload.encode())
    else:
        await send_otp_email(payload, data.login_url)

    return True


class OneTimePass(BaseModel):
    payload: str


class UserLoginResponse(BaseModel):
    token: str
    token_type: str


async def add_to_waitlist(email: str) -> None:
    await asyncio.gather(
        send_waitlist_email(email),
        User.create(email=email, banned=True),
    )


async def create_or_get(email: str) -> User:
    # Gets or creates the user object.
    user_obj = await User.get_or_none(email=email)
    if user_obj is None:
        # For initial rollout, set a few authorized emails through the config,
        # other users will be added to the database but will be banned (meaning,
        # they are waitlisted).
        if (authorized_emails := settings.user.authorized_users) is not None:
            if email not in authorized_emails and email not in settings.user.admin_emails:
                await add_to_waitlist(email)
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You're on the waitlist!")
        user_obj = await User.create(email=email)

    # Validates user.
    if user_obj.banned:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not allowed to log in")
    if user_obj.deleted:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is deleted")

    return user_obj


async def get_login_response(response: Response, user_obj: User) -> UserLoginResponse:
    refresh_token = await RefreshTokenData.encode(user_obj)
    set_token_cookie(response, refresh_token, REFRESH_TOKEN_COOKIE_KEY)
    return UserLoginResponse(token=refresh_token, token_type=TOKEN_TYPE)


@api_router.post("/otp", response_model=UserLoginResponse)
async def otp(data: OneTimePass, response: Response) -> UserLoginResponse:
    payload = OneTimePassPayload.decode(data.payload)
    user_obj = await create_or_get(payload.email)
    return await get_login_response(response, user_obj)


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


@api_router.post("/google")
async def google_login(data: GoogleLogin, response: Response) -> UserLoginResponse:
    try:
        idinfo = await get_google_user_info(data.token)
        email = idinfo["email"]
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
    if idinfo.get("email_verified") is not True:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google email not verified")
    user_obj = await create_or_get(email)
    return await get_login_response(response, user_obj)


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


@api_router.get("/me", response_model=UserInfoResponse)
async def get_user_info(data: SessionTokenData = Depends(get_session_token)) -> UserInfoResponse:
    user_obj = await User.get_or_none(id=data.user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    return UserInfoResponse(email=user_obj.email)


@api_router.delete("/me")
async def delete_user(data: SessionTokenData = Depends(get_session_token)) -> bool:
    user_obj = await User.get_or_none(id=data.user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    await user_obj.delete()
    await send_delete_email(user_obj.email)
    return True


@api_router.delete("/logout")
async def logout_user(response: Response, data: SessionTokenData = Depends(get_session_token)) -> bool:
    response.delete_cookie(key=SESSION_TOKEN_COOKIE_KEY)
    response.delete_cookie(key=REFRESH_TOKEN_COOKIE_KEY)
    return True


class RefreshTokenResponse(BaseModel):
    token: str
    token_type: str


@api_router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(response: Response, data: RefreshTokenData = Depends(get_refresh_token)) -> RefreshTokenResponse:
    token = await Token.get_or_none(id=data.token_id)
    if not token or token.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    session_token = SessionTokenData(user_id=data.user_id).encode()
    set_token_cookie(response, session_token, SESSION_TOKEN_COOKIE_KEY)
    return RefreshTokenResponse(token=session_token, token_type=TOKEN_TYPE)
