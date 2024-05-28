"""Defines the API endpoint for creating, deleting and updating user information."""

import asyncio
import datetime
import logging
from email.utils import parseaddr as parse_email_address

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security.utils import get_authorization_scheme_param
from pydantic.main import BaseModel
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource

from store.app.api.db import Crud
from store.app.api.email import OneTimePassPayload, send_delete_email, send_otp_email, send_waitlist_email
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
    email: str
    ip_addr: str

    @classmethod
    async def encode(cls, user: User, ip_addr: str, db: DynamoDBServiceResource) -> str:
        return await create_refresh_token(user.email, ip_addr, db)

    @classmethod
    def decode(cls, payload: str) -> "RefreshTokenData":
        email, ip_addr = load_refresh_token(payload)
        return cls(email=email, ip_addr=ip_addr)


class SessionTokenData(BaseModel):
    email: str
    ip_addr: str

    def encode(self) -> str:
        expire_minutes = settings.crypto.expire_token_minutes
        expire_after = datetime.timedelta(minutes=expire_minutes)
        return create_token({"eml": self.email, "ip": self.ip_addr}, expire_after=expire_after)

    @classmethod
    def decode(cls, payload: str, host: str) -> "SessionTokenData":
        data = load_token(payload)
        email, ip_addr = data["eml"], data["ip"]
        if ip_addr != host:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid IP address")
        return cls(email=email, ip_addr=ip_addr)


class UserSignup(BaseModel):
    email: str
    login_url: str


def validate_email(email: str) -> str:
    try:
        email = parse_email_address(email)[1]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    return email


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


async def add_to_waitlist(email: str, crud: Crud) -> None:
    await asyncio.gather(
        send_waitlist_email(email),
        crud.add_user(User(email=email, banned=True)),
    )


async def create_or_get(email: str, crud: Crud) -> User:
    # Gets or creates the user object.
    user_obj = await crud.get_user(email)
    if user_obj is None:
        await crud.add_user(User(email=email))
        if (user_obj := await crud.get_user(email)) is None:
            raise RuntimeError("Failed to add user to the database")

    # Validates user.
    if user_obj.banned:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not allowed to log in")
    if user_obj.deleted:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is deleted")

    return user_obj


async def get_login_response(
    request: Request,
    response: Response,
    user_obj: User,
    db: DynamoDBServiceResource,
) -> UserLoginResponse:
    if (client := request.client) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing IP address")
    refresh_token = await RefreshTokenData.encode(user_obj, client.host, db)
    set_token_cookie(response, refresh_token, REFRESH_TOKEN_COOKIE_KEY)
    return UserLoginResponse(token=refresh_token, token_type=TOKEN_TYPE)


@users_router.post("/otp", response_model=UserLoginResponse)
async def otp_endpoint(
    data: OneTimePass,
    request: Request,
    response: Response,
    crud: Crud = Depends(Crud),
) -> UserLoginResponse:
    payload = OneTimePassPayload.decode(data.payload)
    user_obj = await create_or_get(payload.email, crud)
    return await get_login_response(request, response, user_obj, crud)


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
    request: Request,
    response: Response,
    crud: Crud = Depends(Crud),
) -> UserLoginResponse:
    try:
        idinfo = await get_google_user_info(data.token)
        email = idinfo["email"]
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
    if idinfo.get("email_verified") is not True:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google email not verified")
    user_obj = await create_or_get(email, crud)
    return await get_login_response(request, response, user_obj, crud)


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
    if (client := request.client) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing IP address")
    ip_addr = client.host

    # Tries Authorization header.
    authorization = request.headers.get("Authorization") or request.headers.get("authorization")
    if authorization:
        scheme, credentials = get_authorization_scheme_param(authorization)
        if not (scheme and credentials):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if scheme.lower() != TOKEN_TYPE.lower():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return SessionTokenData.decode(credentials, ip_addr)

    # Tries Cookie.
    cookie_token = request.cookies.get(SESSION_TOKEN_COOKIE_KEY)
    if cookie_token:
        return SessionTokenData.decode(cookie_token, ip_addr)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


class UserInfoResponse(BaseModel):
    email: str


@users_router.get("/me", response_model=UserInfoResponse)
async def get_user_info_endpoint(
    data: SessionTokenData = Depends(get_session_token),
    crud: Crud = Depends(Crud),
) -> UserInfoResponse:
    user_obj = await crud.get_user(data.email)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    return UserInfoResponse(email=user_obj.email)


@users_router.delete("/me")
async def delete_user_endpoint(
    data: SessionTokenData = Depends(get_session_token),
    crud: Crud = Depends(Crud),
) -> bool:
    user_obj = await crud.get_user(data.email)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    await crud.delete_user(user_obj)
    await send_delete_email(user_obj.email)
    return True


@users_router.delete("/logout")
async def logout_user_endpoint(response: Response, data: SessionTokenData = Depends(get_session_token)) -> bool:
    response.delete_cookie(key=SESSION_TOKEN_COOKIE_KEY)
    response.delete_cookie(key=REFRESH_TOKEN_COOKIE_KEY)
    return True


class RefreshTokenResponse(BaseModel):
    token: str
    token_type: str


@users_router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_endpoint(
    response: Response,
    data: RefreshTokenData = Depends(get_refresh_token),
    crud: Crud = Depends(Crud),
) -> RefreshTokenResponse:
    token = await crud.get_token(data.email, data.ip_addr)
    if not token or token.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    session_token = SessionTokenData(email=data.email, ip_addr=data.ip_addr).encode()
    set_token_cookie(response, session_token, SESSION_TOKEN_COOKIE_KEY)
    return RefreshTokenResponse(token=session_token, token_type=TOKEN_TYPE)
