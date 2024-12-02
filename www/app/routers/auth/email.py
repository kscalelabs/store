"""Defines the authentication endpoints for email-based authentication."""

from typing import Annotated, Self

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from pydantic.networks import EmailStr

from www.app.crud.users import UserCrud
from www.app.db import Crud
from www.app.model import APIKeySource, User
from www.app.utils.email import send_signup_email
from www.app.utils.password import verify_password

router = APIRouter()

# Make a specific sub-router for the signup-related endpoints.
signup_router = APIRouter()


class EmailSignUpRequest(BaseModel):
    email: EmailStr


class EmailSignUpResponse(BaseModel):
    message: str


@signup_router.post("/create", response_model=EmailSignUpResponse)
async def create_signup_token(
    data: EmailSignUpRequest,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> EmailSignUpResponse:
    """Creates a signup token and emails it to the user."""
    try:
        signup_token = await crud.create_email_signup_token(data.email)
        await send_signup_email(email=data.email, token=signup_token.id)

        return EmailSignUpResponse(message="Sign up email sent! Follow the link sent to you to continue registration.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class GetTokenResponse(BaseModel):
    id: str
    email: str


@signup_router.get("/get/{id}", response_model=GetTokenResponse)
async def get_signup_token(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetTokenResponse:
    signup_token = await crud.get_email_signup_token(id)
    if not signup_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    return GetTokenResponse(id=signup_token.id, email=signup_token.email)


class DeleteTokenResponse(BaseModel):
    message: str


@signup_router.delete("/delete/{id}", response_model=DeleteTokenResponse)
async def delete_signup_token(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> DeleteTokenResponse:
    await crud.delete_email_signup_token(id)
    return DeleteTokenResponse(message="Token deleted successfully.")


router.include_router(signup_router, prefix="/signup")


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


@router.post("/signup", response_model=UserInfoResponseItem)
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


@router.post("/login", response_model=LoginResponse)
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
