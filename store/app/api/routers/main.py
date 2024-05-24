"""Defines the API endpoint for creating, deleting and updating user information."""

import logging

from fastapi import APIRouter

from store.app.api.routers.admin import admin_router
from store.app.api.routers.users import user_router

logger = logging.getLogger(__name__)

api_router = APIRouter()

api_router.include_router(user_router, prefix="/users")
api_router.include_router(admin_router, prefix="/admin")
