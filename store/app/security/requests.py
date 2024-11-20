"""Defines utilities for handling requests."""

import logging
from typing import Literal, Mapping, overload

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)


@overload
async def get_api_key_from_header(headers: Mapping[str, str], require_header: Literal[True]) -> str: ...


@overload
async def get_api_key_from_header(headers: Mapping[str, str], require_header: Literal[False]) -> str | None: ...


async def get_api_key_from_header(headers: Mapping[str, str], require_header: bool) -> str | None:
    authorization = headers.get("Authorization") or headers.get("authorization")
    logger.debug("Received authorization header: %s", authorization)
    if not authorization:
        if require_header:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return None

    # Check if the authorization header starts with "Bearer "
    if authorization.startswith("Bearer "):
        credentials = authorization[7:]  # Remove "Bearer " prefix
    else:
        # If "Bearer " is missing, assume the entire header is the token
        credentials = authorization

    if not credentials:
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail="Authorization header is invalid")

    return credentials


async def get_request_api_key_id(request: Request) -> str:
    return await get_api_key_from_header(request.headers, True)


async def maybe_get_request_api_key_id(request: Request) -> str | None:
    return await get_api_key_from_header(request.headers, False)
