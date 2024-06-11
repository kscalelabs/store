"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
import uuid
from email.utils import parseaddr as parse_email_address
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic.main import BaseModel

from store.app.crypto import hash_password, new_token
from store.app.db import Crud
from store.app.model import User
from store.app.utils.email import send_delete_email, send_verify_email
from store.settings import settings

logger = logging.getLogger(__name__)

users_router = APIRouter()

TOKEN_TYPE = "Bearer"


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return token


class UserLogin(BaseModel):
    email: str
    password: str


def validate_email(email: str) -> str:
    try:
        email = parse_email_address(email)[1]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    return email


@users_router.post("/register")
async def register_user_endpoint(data: UserLogin, crud: Crud) -> bool:
    """ "Registers a new user with the given email and password."""
    email = validate_email(data.email)
    user = await crud.get_user_from_email(email)
    if user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")
    await crud.add_user(User(username="", email=email, password=hash_password(data.password)))
    verify_email_token = new_token()
    await crud.add_verify_email(email, verify_email_token)
    await send_verify_email(email, verify_email_token)
    return True


@users_router.get("/verify_email/{token}")
async def verify_email_user_endpoint(token: str, crud: Crud) -> bool:
    """Verifies a user's email address."""
    await crud.check_verify_email_token(token)
    return True


@users_router.post("/login")
async def login_user_endpoint(data: UserLogin, crud: Crud, response: Response) -> bool:
    """Gives the user a session token if they present the correct credentials.

    Args:
        data: User email and password.
        crud: The CRUD object.
        response: The response object.

    Returns:
        True if the credentials are correct.
    """
    user = crud.get_user_from_email(data.email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if hash_password(data.password) != user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    response.set_cookie(key="session_token", value=new_token(), httponly=True, domain=settings.homepage.domain)

    return True


class UserInfoResponse(BaseModel):
    email: str


@users_router.get("/me", response_model=UserInfoResponse)
async def get_user_info_endpoint(
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserInfoResponse:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user_obj = await crud.get_user(user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserInfoResponse(email=user_obj.email)


@users_router.delete("/me")
async def delete_user_endpoint(
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
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
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    await crud.delete_session_token(token)
    return True


@users_router.get("/{user_id}", response_model=UserInfoResponse)
async def get_user_info_by_id_endpoint(user_id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> UserInfoResponse:
    user_obj = await crud.get_user(uuid.UUID(user_id))
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserInfoResponse(email=user_obj.email)
