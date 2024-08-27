"""Defines the API endpoint for creating, deleting and updating user information."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from httpx import AsyncClient
from pydantic.main import BaseModel

from store.app.db import Crud
from store.settings import settings

logger = logging.getLogger(__name__)

google_auth_router = APIRouter()


class GoogleLogin(BaseModel):
    token: str


async def get_google_user_email(token: str) -> str:
    async with AsyncClient() as session:
        response = await session.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            params={"access_token": token},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
        data = response.json()
        return data["email"]


class ClientIdResponse(BaseModel):
    client_id: str


@google_auth_router.get("/client-id", response_model=ClientIdResponse)
async def google_client_id_endpoint() -> ClientIdResponse:
    return ClientIdResponse(client_id=settings.oauth.google_client_id)


class AuthResponse(BaseModel):
    api_key: str


@google_auth_router.post("/login", response_model=AuthResponse)
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
