"""Defines the API endpoint for authenticating with Github."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from httpx import AsyncClient, Response as HttpxResponse
from pydantic.main import BaseModel

from store.app.db import Crud
from store.settings import settings

logger = logging.getLogger(__name__)

github_auth_router = APIRouter()


@github_auth_router.get("/login")
async def github_login() -> str:
    """Gives the user a redirect url to login with github.

    Returns:
        Github oauth redirect url.
    """
    return f"https://github.com/login/oauth/authorize?scope=user:email&client_id={settings.oauth.github_client_id}"


async def github_access_token_req(params: dict[str, str], headers: dict[str, str]) -> HttpxResponse:
    async with AsyncClient() as client:
        return await client.post(
            url="https://github.com/login/oauth/access_token",
            params=params,
            headers=headers,
        )


async def github_req(headers: dict[str, str]) -> HttpxResponse:
    async with AsyncClient() as client:
        return await client.get("https://api.github.com/user", headers=headers)


async def github_email_req(headers: dict[str, str]) -> HttpxResponse:
    async with AsyncClient() as client:
        return await client.get("https://api.github.com/user/emails", headers=headers)


class GithubAuthResponse(BaseModel):
    api_key: str


@github_auth_router.get("/code/{code}", response_model=GithubAuthResponse)
async def github_code(
    code: str,
    crud: Annotated[Crud, Depends(Crud.get)],
    response: Response,
) -> GithubAuthResponse:
    """Gives the user a session token upon successful github authentication and creation of user.

    Args:
        code: Github code returned from the successful authentication.
        crud: The CRUD object.
        response: The response object.

    Returns:
        UserInfoResponse.
    """
    params = {
        "client_id": settings.oauth.github_client_id,
        "client_secret": settings.oauth.github_client_secret,
        "code": code,
    }

    headers = {"Accept": "application/json"}
    oauth_response = await github_access_token_req(params, headers)
    if not oauth_response.is_success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Github authentication failed")
    if "access_token" not in (response_json := oauth_response.json()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not found in response from Github")

    # access token is used to retrieve user oauth details
    access_token = response_json["access_token"]
    headers.update({"Authorization": f"Bearer {access_token}"})
    oauth_response = await github_req(headers)
    oauth_email_response = await github_email_req(headers)

    github_id = oauth_response.json()["html_url"]
    email = next(entry["email"] for entry in oauth_email_response.json() if entry["primary"])

    user = await crud.get_user_from_github_token(github_id, email)

    api_key = await crud.add_api_key(
        user_id=user.id,
        source="oauth",
        permissions="full",  # OAuth tokens have full permissions.
    )

    return GithubAuthResponse(api_key=api_key.id)
