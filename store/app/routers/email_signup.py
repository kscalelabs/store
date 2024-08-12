"""This module defines the FastAPI routes for managing email related API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from store.app.crud.email_signup import EmailSignUpCrud
from store.app.utils.email import send_signup_email

email_router = APIRouter()


# Request Model
class EmailSignUpRequest(BaseModel):
    email: EmailStr


# Response Models
class EmailSignUpResponse(BaseModel):
    message: str


class GetTokenResponse(BaseModel):
    id: str
    email: str


class DeleteTokenResponse(BaseModel):
    message: str


@email_router.post("/signup/create/", response_model=EmailSignUpResponse)
async def create_signup_token(data: EmailSignUpRequest) -> EmailSignUpResponse:
    """Creates a signup token and emails it to the user."""
    async with EmailSignUpCrud() as crud:
        try:
            signup_token = await crud.create_email_signup_token(data.email)
            await send_signup_email(email=data.email, token=signup_token.id)

            return EmailSignUpResponse(
                message="Sign up email sent! Follow the link sent to you to continue registration."
            )
        except Exception as e:
            print(f"Error creating signup token: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@email_router.get("/signup/get/{id}", response_model=GetTokenResponse)
async def get_signup_token(id: str) -> GetTokenResponse:
    """Attempts to get a email sign up token given an id."""
    async with EmailSignUpCrud() as crud:
        signup_token = await crud.get_email_signup_token(id)
        if not signup_token:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")

        # Map the EmailSignUpToken to GetTokenResponse
        return GetTokenResponse(id=signup_token.id, email=signup_token.email)


@email_router.delete("/signup/delete/{id}", response_model=DeleteTokenResponse)
async def delete_signup_token(id: str, crud: EmailSignUpCrud = Depends()) -> DeleteTokenResponse:
    """Deletes email signup token given an id."""
    await crud.delete_email_signup_token(id)
    return DeleteTokenResponse(message="Token deleted successfully.")
