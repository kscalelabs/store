"""Defines authentication utilities for AWS Cognito."""

import logging
import secrets
import urllib.parse
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.openapi.docs import get_swagger_ui_oauth2_redirect_html
from fastapi.responses import HTMLResponse
from jose import jwt
from pydantic import BaseModel

# Assuming appropriate imports and settings
from www.app.db import Crud
from www.app.security.cognito import api_key_header
from www.settings import settings

# Configure logger
logger = logging.getLogger(__name__)

# Define router
router = APIRouter()

# Ensure these settings are correctly fetched
COGNITO_DOMAIN = settings.oauth.cognito_domain
CLIENT_ID = settings.oauth.cognito_client_id
CLIENT_SECRET = settings.oauth.cognito_client_secret
REDIRECT_URI = settings.oauth.cognito_redirect_uri


class AuthorizationURLResponse(BaseModel):
    authorization_url: str


async def verify_cognito_token(id_token: str, access_token: Optional[str] = None) -> dict:
    """Verify the JWT token from Cognito."""
    try:

        # Get the key id from the token header
        headers = jwt.get_unverified_headers(id_token)
        kid = headers["kid"]

        # Get the public keys from Cognito
        region = "us-east-1"  # Your Cognito region
        user_pool_id = settings.oauth.cognito_user_pool_id
        keys_url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"

        async with httpx.AsyncClient() as client:
            response = await client.get(keys_url)
            jwks = response.json()
            logger.info("Retrieved JWKS from Cognito")

        # Find the key that matches the kid from the token
        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if not key:
            raise ValueError("Public key not found in jwks.json")

        # Verify the claims
        claims = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            audience=settings.oauth.cognito_client_id,
            issuer=f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}",
            options={"verify_at_hash": False},  # Disable at_hash verification
        )

        return claims

    except Exception as e:
        logger.error("Token verification failed: %s", str(e))
        raise ValueError(f"Token verification failed: {str(e)}")


class TokenRequest(BaseModel):
    code: str


# Add response model for Cognito
class CognitoAuthResponse(BaseModel):
    api_key: str


@router.post("/code", response_model=CognitoAuthResponse)
async def cognito_code(
    data: TokenRequest,
    crud: Crud = Depends(Crud.get),
) -> CognitoAuthResponse:
    """Exchange authorization code for an API key."""
    try:
        # Convert redirect URI to match what Cognito expects
        redirect_uri = REDIRECT_URI
        if "127.0.0.1" in REDIRECT_URI:
            redirect_uri = REDIRECT_URI.replace("127.0.0.1", "localhost")

        async with httpx.AsyncClient() as client:
            token_data = {
                "grant_type": "authorization_code",
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "code": data.code,
                "redirect_uri": redirect_uri,
            }

            token_response = await client.post(
                f"{COGNITO_DOMAIN}/oauth2/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if token_response.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=token_response.text)

            tokens = token_response.json()
            claims = await verify_cognito_token(id_token=tokens["id_token"])

            user = await crud.create_user_from_cognito(
                email=claims["email"],
                cognito_id=claims["sub"],
                first_name=claims.get("given_name"),
                last_name=claims.get("family_name"),
            )

            api_key, raw_key = await crud.add_api_key(user_id=user.id, source="cognito", permissions="full")

            return CognitoAuthResponse(api_key=raw_key)

    except Exception as e:
        logger.error("Code exchange error: %s", str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/callback")
async def cognito_callback(
    code: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    state: str | None = None,
    crud: Crud = Depends(Crud.get),
) -> dict:
    try:
        if error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"Authentication error: {error} - {error_description}"
            )

        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No authorization code provided")

        async with httpx.AsyncClient() as client:
            token_data = {
                "grant_type": "authorization_code",
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "code": code,
                "redirect_uri": REDIRECT_URI,
            }

            token_response = await client.post(
                f"{COGNITO_DOMAIN}/oauth2/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if token_response.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=token_response.text)

            tokens = token_response.json()
            claims = await verify_cognito_token(id_token=tokens["id_token"])

            user = await crud.create_user_from_cognito(
                email=claims["email"],
                cognito_id=claims["sub"],
                first_name=claims.get("given_name"),
                last_name=claims.get("family_name"),
            )

            api_key, raw_key = await crud.add_api_key(user_id=user.id, source="cognito", permissions="full")

            return {
                "api_key": raw_key,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            }

    except Exception as e:
        logger.error("Error in cognito_callback: %s", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class CognitoConfigResponse(BaseModel):
    client_id: str
    domain: str


@router.get("/login", response_model=AuthorizationURLResponse)
async def cognito_login() -> AuthorizationURLResponse:
    domain = COGNITO_DOMAIN.rstrip("/")
    if not domain.startswith("https://"):
        domain = f"https://{domain}"

    # Match the scopes configured in Cognito
    scopes = ["openid", "email", "phone"]
    scope_string = " ".join(scopes)

    auth_params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "scope": scope_string,
        "redirect_uri": REDIRECT_URI,
        "state": secrets.token_urlsafe(32),
        "prompt": "login",
    }

    auth_url = f"{domain}/oauth2/authorize?{urllib.parse.urlencode(auth_params)}"
    logger.info("Generated auth URL: %s", auth_url)

    return AuthorizationURLResponse(authorization_url=auth_url)


@router.get("/oauth2-redirect", include_in_schema=False)
async def swagger_ui_redirect() -> HTMLResponse:
    """Handle OAuth2 redirect for Swagger UI."""
    return get_swagger_ui_oauth2_redirect_html()


@router.get("/logout")
async def cognito_logout(api_key: str = Depends(api_key_header), crud: Crud = Depends(Crud.get)) -> dict:
    """Logout user by deleting their API key and returning Cognito logout URL."""
    try:
        # Get the API key object
        api_key_obj = await crud.get_api_key(api_key)
        if not api_key_obj:
            # Return success response even if API key is invalid/expired
            cognito_logout_url = (
                f"{COGNITO_DOMAIN}/logout"
                f"?client_id={CLIENT_ID}"
                f"&logout_uri={urllib.parse.quote(settings.site.homepage)}"
            )
            return {"message": "Already logged out", "cognito_logout_url": cognito_logout_url}

        # Delete the API key using the database ID
        await crud.delete_api_key(api_key_obj)  # Pass the full object instead of just the raw key

        # Construct Cognito logout URL
        cognito_logout_url = (
            f"{COGNITO_DOMAIN}/logout"
            f"?client_id={CLIENT_ID}"
            f"&logout_uri={urllib.parse.quote(settings.site.homepage)}"
        )

        return {"message": "Successfully logged out", "cognito_logout_url": cognito_logout_url}

    except Exception as e:
        logger.error("Error during logout: %s", e)
        # Return a generic error message instead of exposing internal errors
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request")
