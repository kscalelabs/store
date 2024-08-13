"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
from typing import Annotated

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic.main import BaseModel

from store.app.db import Crud

logger = logging.getLogger(__name__)

google_auth_router = APIRouter()


class GoogleLogin(BaseModel):
    token: str


async def get_google_user_email(token: str) -> str:
    async with aiohttp.ClientSession() as session:
        response = await session.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            params={"access_token": token},
        )
        if response.status != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
        return (await response.json())["email"]


class AuthResponse(BaseModel):
    api_key: str


@google_auth_router.post("/login")
async def google_login_endpoint(
    data: GoogleLogin,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> AuthResponse:
    email = await get_google_user_email(data.token)
    user = await crud.get_user_from_google_token(email)

    api_key = await crud.add_api_key(
        user_id=user.id,
        source="oauth",
        permissions="full",  # OAuth tokens have full permissions.
    )

    return AuthResponse(api_key=api_key.id)
