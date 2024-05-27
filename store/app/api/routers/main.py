"""Defines the main API endpoint."""

import logging

from fastapi import APIRouter

from store.app.api.routers.users import users_router

logger = logging.getLogger(__name__)

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["users"])
