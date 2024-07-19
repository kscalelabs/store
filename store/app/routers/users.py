"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
from email.utils import parseaddr as parse_email_address
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.security.utils import get_authorization_scheme_param
from httpx import AsyncClient
from pydantic.main import BaseModel as PydanticBaseModel

from store.app.crypto import check_password, new_token
from store.app.db import Crud
from store.app.model import OauthUser, User
from store.app.utils.email import send_change_email, send_delete_email, send_register_email, send_reset_password_email
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


@users_router.post("/send-register-email")
async def send_register_email_endpoint(
    data: SendRegister,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    """Sends a verification email to the new email address."""
    email = validate_email(data.email)
    verify_email_token = new_token()
    # Magic number: 7 days
    await crud.add_register_token(verify_email_token, email, 60 * 60 * 24 * 7)
    await send_register_email(email, verify_email_token)
    return True


@users_router.get("/registration-email/{token}")
async def get_registration_email_endpoint(
    token: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> str:
    """Gets the email address associated with a registration token."""
    return await crud.check_register_token(token)


class UserRegister(BaseModel):
    token: str
    username: str
    password: str


@users_router.post("/register")
async def register_user_endpoint(
    data: UserRegister,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    """Registers a new user with the given email and password."""
    email = await crud.check_register_token(data.token)
    user = await crud.get_user_from_email(email)
    if user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")
    user = User.create(username=data.username, email=email, password=data.password)
    await crud.add_user(user)
    return True


class UserForgotPassword(BaseModel):
    email: str


@users_router.post("/forgot-password")
async def forgot_password_user_endpoint(
    data: UserForgotPassword,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    """Sends a reset password email to the user."""
    email = validate_email(data.email)
    user = await crud.get_user_from_email(email)
    if user is None:
        return True
    reset_password_token = new_token()
    # Magic number: 1 hour
    await crud.add_reset_password_token(reset_password_token, user.user_id, 60 * 60)
    await send_reset_password_email(email, reset_password_token)
    return True


class ResetPassword(BaseModel):
    password: str


@users_router.post("/reset-password/{token}")
async def reset_password_user_endpoint(
    token: str,
    data: ResetPassword,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    """Resets a user's password."""
    await crud.use_reset_password_token(token, data.password)
    return True


class NewEmail(BaseModel):
    new_email: str


@users_router.post("/change-email")
async def send_change_email_user_endpoint(
    data: NewEmail,
    crud: Annotated[Crud, Depends(Crud.get)],
    token: Annotated[str, Depends(get_session_token)],
) -> bool:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = await crud.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    change_email_token = new_token()
    """Sends a verification email to the new email address."""
    # Magic number: 1 hour
    await crud.add_change_email_token(change_email_token, user.user_id, data.new_email, 60 * 60)
    await send_change_email(data.new_email, change_email_token)
    return True


@users_router.post("/change-email/{token}")
async def change_email_user_endpoint(
    token: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    """Changes the user's email address."""
    await crud.use_change_email_token(token)
    return True


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


@users_router.post("/change-password")
async def change_password_user_endpoint(
    data: ChangePassword,
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    """Changes the user's password."""
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = await crud.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not check_password(data.old_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    await crud.change_password(user_id, data.new_password)
    return True


class UserLogin(BaseModel):
    email: str
    password: str


@users_router.post("/login")
async def login_user_endpoint(
    data: UserLogin,
    crud: Annotated[Crud, Depends(Crud.get)],
    response: Response,
) -> bool:
    """Gives the user a session token if they present the correct credentials.

    Args:
        data: User email and password.
        crud: The CRUD object.
        response: The response object.

    Returns:
        True if the credentials are correct.
    """
    user = await crud.get_user_from_email(data.email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not check_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = new_token()
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
    )
    await crud.add_session_token(token, user.user_id, 60 * 60 * 24 * 7)

    return True


class UserInfoResponse(BaseModel):
    email: str
    username: str
    user_id: str
    admin: bool


@users_router.get("/me", response_model=UserInfoResponse)
async def get_user_info_endpoint(
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserInfoResponse:
    user_id = await crud.get_user_id_from_session_token(token)
    if user_id is None:
        print("executed 1")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user_obj = await crud.get_user(user_id)
    if user_obj is None:
        print("executed 2")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserInfoResponse(
        email=user_obj.email,
        username=user_obj.username,
        user_id=user_obj.user_id,
        admin=user_obj.admin,
    )


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
    await crud.delete_user(user_id)
    await send_delete_email(user_obj.email)
    return True


@users_router.delete("/logout")
async def logout_user_endpoint(
    token: Annotated[str, Depends(get_session_token)],
    crud: Annotated[Crud, Depends(Crud.get)],
    response: Response,
) -> bool:
    await crud.delete_session_token(token)
    response.delete_cookie("session_token")
    return True


class PublicUserInfoResponse(BaseModel):
    username: str
    user_id: str


@users_router.get("/batch", response_model=list[PublicUserInfoResponse])
async def get_users_batch_endpoint(
    crud: Annotated[Crud, Depends(Crud.get)],
    user_ids: list[str] = Query(...),
) -> list[PublicUserInfoResponse]:
    user_objs = await crud.get_user_batch(user_ids)
    return [
        PublicUserInfoResponse(
            username=user_obj.username,
            user_id=user_obj.user_id,
        )
        for user_obj in user_objs
    ]


class SessionData(BaseModel):
    username: str


@users_router.get("/github-login")
async def github_login() -> str:
    """Gives the user a redirect url to login with github.

    Returns:
        Github oauth redirect url.
    """
    return f"https://github.com/login/oauth/authorize?client_id={settings.oauth.github_client_id}"


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
            url="https://github.com/login/oauth/access_token", params=params, headers=headers
        )
    response_json = oauth_response.json()

    # access token is used to retrieve user oauth details
    access_token = response_json["access_token"]
    async with AsyncClient() as client:
        headers.update({"Authorization": f"Bearer {access_token}"})
        oauth_response = await client.get("https://api.github.com/user", headers=headers)

    github_id = oauth_response.json()["html_url"]
    github_username = oauth_response.json()["login"]

    user = await crud.get_user_from_oauth_id(github_id)

    # Create a user if it doesn't exist, with a dummy email
    # since email is required for secondary indexing.
    if user is None:
        user = OauthUser.create(username=github_username, oauth_id=github_id)
        await crud.add_user(user)

    token = new_token()

    await crud.add_session_token(token, user.user_id, 60 * 60 * 24 * 7)

    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
    )

    user_obj = await crud.get_user(user.user_id)

    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserInfoResponse(
        email=user_obj.email,
        username=user_obj.username,
        user_id=user_obj.user_id,
        admin=user_obj.admin,
    )


@users_router.get("/{user_id}", response_model=PublicUserInfoResponse)
async def get_user_info_by_id_endpoint(
    user_id: str, crud: Annotated[Crud, Depends(Crud.get)]
) -> PublicUserInfoResponse:
    user_obj = await crud.get_user(user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return PublicUserInfoResponse(
        username=user_obj.username,
        user_id=user_obj.user_id,
    )
