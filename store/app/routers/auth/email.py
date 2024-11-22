"""Defines the authentication endpoints for email-based authentication."""

from typing import Annotated, Self

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from pydantic.networks import EmailStr

from store.app.crud.users import UserCrud
from store.app.db import Crud
from store.app.model import APIKeySource, User
from store.app.utils.email import send_signup_email, send_reset_password_email
from store.app.utils.password import verify_password
from store.app.utils.password import hash_password

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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def generate_password_reset_token(
    data: ForgotPasswordRequest, crud: Annotated[Crud, Depends(Crud.get)]
) -> ForgotPasswordResponse:
    try:
        if user := await crud.get_user_from_email(data.email):
            await crud.delete_password_reset_token_by_email(user.email)
            reset_token = await crud.create_password_reset_token(email=user.email)

            await send_reset_password_email(email=user.email, token=reset_token.id)

        return ForgotPasswordResponse(message="If the email is registered, a password reset link will be sent.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class GetResetTokenResponse(BaseModel):
    id: str
    email: str


@router.get("/get-reset-token/{id}", response_model=GetResetTokenResponse)
async def get_reset_password_token(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetResetTokenResponse:
    reset_token = await crud.get_password_reset_token(id)
    if not reset_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    return GetResetTokenResponse(id=reset_token.id, email=reset_token.email)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    message: str
    email: str


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def validate_password_reset_token(
    data: ResetPasswordRequest, crud: Annotated[Crud, Depends(Crud.get)]
) -> ResetPasswordResponse:
    reset_token = await crud.get_password_reset_token(data.token)
    if not reset_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired reset token")

    user = await crud.get_user_from_email(reset_token.email)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not Found")

    # Update user password
    updated_user = await crud.update_user(
        user_id=user.id, updates={"hashed_password": hash_password(data.new_password)}
    )

    # Remove reset token
    await crud.delete_password_reset_token(data.token)

    return ResetPasswordResponse(message="Password updated successful", email=updated_user.email)
