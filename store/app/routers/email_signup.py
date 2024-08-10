"""This module defines the FastAPI routes for managing email sign-up tokens."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from store.app.crud.email_signup import EmailSignUpCrud
from store.app.utils.email import send_register_email

email_signup_router = APIRouter()


# Request Model
class EmailSignUpRequest(BaseModel):
    email: EmailStr


# Response Models
class EmailSignUpResponse(BaseModel):
    message: str


class GetTokenResponse(BaseModel):
    email: str
    created_at: str


class DeleteTokenResponse(BaseModel):
    message: str


# POST: Create Signup Token
@email_signup_router.post("/create/", response_model=EmailSignUpResponse)
async def create_signup_token(data: EmailSignUpRequest) -> EmailSignUpResponse:
    async with EmailSignUpCrud() as crud:
        try:
            signup_token = await crud.create_email_signup_token(data.email)
            await send_register_email(email=data.email, token=signup_token.id)

            return {"message": "Sign up email sent! Follow the link sent to you to continue registration."}
        except Exception as e:
            print(f"Error creating signup token: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# GET: Retrieve Signup Token
@email_signup_router.get("/get/{id}", response_model=GetTokenResponse)
async def get_signup_token(id: str, crud: EmailSignUpCrud = Depends()) -> GetTokenResponse:
    signup_token = await crud.get_email_signup_token(id)
    if not signup_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    return signup_token


# DELETE: Delete Signup Token
@email_signup_router.delete("/delete/{id}", response_model=DeleteTokenResponse)
async def delete_signup_token(id: str, crud: EmailSignUpCrud = Depends()) -> DeleteTokenResponse:
    deleted = await crud.delete_email_signup_token(id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    return {"message": "Token deleted successfully."}
