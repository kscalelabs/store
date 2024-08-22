"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
from email.utils import parseaddr as parse_email_address
from typing import Annotated, Any, Literal, Self, overload

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from fastapi.security.utils import get_authorization_scheme_param
from pydantic.main import BaseModel
from pydantic.networks import EmailStr

from store.app.crud.base import ItemNotFoundError
from store.app.crud.users import UserCrud
from store.app.db import Crud
from store.app.errors import NotAuthenticatedError
from store.app.model import APIKeySource, User, UserPermission, UserPublic
from store.app.routers.auth.github import github_auth_router
from store.app.routers.auth.google import google_auth_router
from store.app.utils.email import send_delete_email
from store.app.utils.password import verify_password

logger = logging.getLogger(__name__)

users_router = APIRouter()

TOKEN_TYPE = "Bearer"


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


def validate_email(email: str) -> str:
    try:
        email = parse_email_address(email)[1]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")
    return email


class UserSignup(BaseModel):
    signup_token_id: str
    email: str
    password: str


class MyUserInfoResponse(BaseModel):
    user_id: str
    email: str
    github_id: str | None
    google_id: str | None
    permissions: set[UserPermission] | None


@users_router.get("/me", response_model=MyUserInfoResponse)
async def get_user_info_endpoint(
    user: Annotated[User, Depends(get_session_user_with_read_permission)],
) -> MyUserInfoResponse | None:
    try:
        return MyUserInfoResponse(
            user_id=user.id,
            email=user.email,
            google_id=user.google_id,
            github_id=user.github_id,
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


class UserInfoResponseItem(BaseModel):
    id: str
    email: str

    @classmethod
    def from_user(cls, user: User) -> Self:
        return cls(
            id=user.id,
            email=user.email,
        )


class UsersInfoResponse(BaseModel):
    users: list[UserInfoResponseItem]


class PublicUserInfoResponseItem(BaseModel):
    id: str
    email: str
    permissions: set[UserPermission] | None = None
    created_at: int | None = None
    updated_at: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None
    bio: str | None = None

    @classmethod
    def from_user(cls, user: User | UserPublic) -> Self:
        return cls(
            id=user.id,
            email=user.email,
            permissions=user.permissions,
            created_at=user.created_at,
            updated_at=user.updated_at,
            first_name=user.first_name,
            last_name=user.last_name,
            name=user.name,
            bio=user.bio,
        )


class PublicUsersInfoResponse(BaseModel):
    users: list[PublicUserInfoResponseItem]


@users_router.post("/signup", response_model=UserInfoResponseItem)
async def register_user(data: UserSignup, crud: Annotated[Crud, Depends(Crud.get)]) -> UserInfoResponseItem:
    signup_token = await crud.get_email_signup_token(data.signup_token_id)
    if not signup_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired registration token")
    existing_user = await crud.get_user_from_email(signup_token.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    user = await crud._create_user_from_email(email=signup_token.email, password=data.password)
    await crud.delete_email_signup_token(data.signup_token_id)
    return UserInfoResponseItem(id=user.id, email=user.email)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    user_id: str
    token: str


@users_router.post("/login", response_model=LoginResponse)
async def login_user(data: LoginRequest, user_crud: UserCrud = Depends()) -> LoginResponse:
    async with user_crud:
        # Fetch user by email
        user = await user_crud.get_user_from_email(data.email)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        # Determine if the user logged in via OAuth or hashed password
        source: APIKeySource
        if user.hashed_password is None:
            # OAuth login
            if user.google_id or user.github_id:
                source = "oauth"
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown login source")
        else:
            # Password login
            if not verify_password(data.password, user.hashed_password):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
            source = "password"

        api_key = await user_crud.add_api_key(
            user.id,
            source=source,
            permissions="full",  # Users with verified email accounts have full permissions.
        )

        return LoginResponse(user_id=user.id, token=api_key.id)


@users_router.get("/batch", response_model=PublicUsersInfoResponse)
async def get_users_batch_endpoint(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(...),
) -> PublicUsersInfoResponse:
    users = await crud.get_user_batch(ids)
    return PublicUsersInfoResponse(users=[PublicUserInfoResponseItem.from_user(user) for user in users])


@users_router.get("/public/batch", response_model=PublicUsersInfoResponse)
async def get_users_public_batch_endpoint(
    crud: Annotated[Crud, Depends(Crud.get)],
    ids: list[str] = Query(...),
) -> PublicUsersInfoResponse:
    users = await crud.get_user_batch(ids)
    return PublicUsersInfoResponse(users=[PublicUserInfoResponseItem.from_user(user) for user in users])


@users_router.get("/{id}", response_model=UserInfoResponseItem)
async def get_user_info_by_id_endpoint(id: str, crud: Annotated[Crud, Depends(Crud.get)]) -> UserInfoResponseItem:
    user = await crud.get_user(id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserInfoResponseItem.from_user(user)


@users_router.get("/public/me", response_model=UserPublic)
async def get_my_public_user_info_endpoint(
    user: User = Depends(get_session_user_with_read_permission),
) -> PublicUserInfoResponseItem:
    return PublicUserInfoResponseItem.from_user(user)


@users_router.get("/public/{id}", response_model=UserPublic)
async def get_public_user_info_by_id_endpoint(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> PublicUserInfoResponseItem:
    user = await crud.get_user_public(id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return PublicUserInfoResponseItem.from_user(user)


@users_router.put("/me", response_model=UserPublic)
async def update_profile(
    updates: Annotated[dict[str, Any], Body(...)],
    user: Annotated[User, Depends(get_session_user_with_admin_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> UserPublic:
    try:
        logger.info("Updates: %s", updates)
        updated_user = await crud.update_user(user.id, updates)
        return UserPublic(**updated_user.model_dump())  # Convert to UserPublic
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the profile.",
        )


users_router.include_router(github_auth_router, prefix="/github")
users_router.include_router(google_auth_router, prefix="/google")
