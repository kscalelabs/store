"""This module defines the FastAPI routes for authentication related API routes."""

from typing import Annotated, Literal, Mapping, Self, overload

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr

from store.app.crud.users import UserCrud
from store.app.db import Crud
from store.app.model import APIKeySource, User
from store.app.routers.auth.github import github_auth_router
from store.app.routers.auth.google import google_auth_router
from store.app.utils.password import verify_password

auth_router = APIRouter()


@overload
async def get_api_key_from_header(headers: Mapping[str, str], require_header: Literal[True]) -> str: ...


@overload
async def get_api_key_from_header(headers: Mapping[str, str], require_header: Literal[False]) -> str | None: ...


async def get_api_key_from_header(headers: Mapping[str, str], require_header: bool) -> str | None:
    authorization = headers.get("Authorization") or headers.get("authorization")
    if not authorization:
        if require_header:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return None

    # Check if the authorization header starts with "Bearer "
    if authorization.startswith("Bearer "):
        credentials = authorization[7:]  # Remove "Bearer " prefix
    else:
        # If "Bearer " is missing, assume the entire header is the token
        credentials = authorization

    if not credentials:
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail="Authorization header is invalid")

    return credentials


async def get_request_api_key_id(request: Request) -> str:
    return await get_api_key_from_header(request.headers, True)


async def maybe_get_request_api_key_id(request: Request) -> str | None:
    return await get_api_key_from_header(request.headers, False)


class UserSignup(BaseModel):
    signup_token_id: str
    email: str
    password: str


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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    user_id: str
    token: str


@auth_router.post("/signup", response_model=UserInfoResponseItem)
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


@auth_router.post("/login", response_model=LoginResponse)
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


auth_router.include_router(github_auth_router, prefix="/github")
auth_router.include_router(google_auth_router, prefix="/google")


@auth_router.delete("/logout")
async def logout_user_endpoint(
    token: Annotated[str, Depends(get_request_api_key_id)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    await crud.delete_api_key(token)
    return True
