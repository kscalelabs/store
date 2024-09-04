"""This module defines the FastAPI routes for managing email related API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic.main import BaseModel
from pydantic.networks import EmailStr

from store.app.db import Crud
from store.app.utils.email import send_signup_email

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


class DeleteTokenResponse(BaseModel):
    message: str


@signup_router.get("/get/{id}", response_model=GetTokenResponse)
async def get_signup_token(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> GetTokenResponse:
    signup_token = await crud.get_email_signup_token(id)
    if not signup_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    return GetTokenResponse(id=signup_token.id, email=signup_token.email)


@signup_router.delete("/delete/{id}", response_model=DeleteTokenResponse)
async def delete_signup_token(
    id: str,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> DeleteTokenResponse:
    await crud.delete_email_signup_token(id)
    return DeleteTokenResponse(message="Token deleted successfully.")


email_router = APIRouter()
email_router.include_router(signup_router, prefix="/signup", tags=["signup"])
