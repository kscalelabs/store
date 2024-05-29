"""Defines the main API endpoint."""

import logging

from fastapi import APIRouter, HTTPException, status

from store.app.api.routers.users import users_router

logger = logging.getLogger(__name__)

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["users"])


# Returns a 404 response for all other paths.
@api_router.get("/{path:path}")
async def not_found(path: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
