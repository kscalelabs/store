"""This module defines the FastAPI routes for managing email sign-up tokens."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from store.app.crud.users import UserCrud

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
async def create_signup_token(data: EmailSignUpRequest, crud: UserCrud = Depends()) -> EmailSignUpResponse:
    try:
        await crud.create_email_signup_token(data.email)
        return {"message": "Sign-up token created successfully."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# GET: Retrieve Signup Token
@email_signup_router.get("/get/{token}", response_model=GetTokenResponse)
async def get_signup_token(token: str, crud: UserCrud = Depends()) -> GetTokenResponse:
    signup_token = await crud.get_email_signup_token(token)
    if not signup_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    return signup_token


# DELETE: Delete Signup Token
@email_signup_router.delete("/delete/{token}", response_model=DeleteTokenResponse)
async def delete_signup_token(token: str, crud: UserCrud = Depends()) -> DeleteTokenResponse:
    deleted = await crud.delete_email_signup_token(token)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found.")
    return {"message": "Token deleted successfully."}
