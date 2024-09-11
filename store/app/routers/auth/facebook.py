import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from httpx import AsyncClient
from pydantic.main import BaseModel

from store.app.db import Crud
from store.settings import settings

logger = logging.getLogger(__name__)

facebook_auth_router = APIRouter()

class FacebookLogin(BaseModel):
    client_id: str

async def get_facebook_user_email(token: str) -> str:
    async with AsyncClient() as session:
        response = await session.get(
            "https://graph.facebook.com/me",
            params={
                "access_token": token,
                "fields": "email",
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Facebook token")
        data = response.json()
        return data.get("email")


class ClientIdResponse(BaseModel):
    client_id: str


@facebook_auth_router.get("/client-id", response_model=ClientIdResponse)
async def facebook_client_id_endpoint() -> ClientIdResponse:
    return ClientIdResponse(client_id=settings.oauth.facebook_client_id)


class AuthResponse(BaseModel):
    api_key: str


@facebook_auth_router.post("/login", response_model=AuthResponse)
async def facebook_login_endpoint(
    data: FacebookLogin,
    crud: Annotated[Crud, Depends(Crud.get)],
) -> AuthResponse:
    email = await get_facebook_user_email(data.token)
    user = await crud.get_user_from_facebook_token(email)

    api_key = await crud.add_api_key(
        user_id=user.id,
        source="oauth",
        permissions="full", 
    )

    return AuthResponse(api_key=api_key.id)
