"""Defines the authentication endpoints for the API."""

from fastapi import APIRouter

from store.app.routers.auth.api import router as api_router
from store.app.routers.auth.email import router as email_router
from store.app.routers.auth.github import router as github_router
from store.app.routers.auth.google import router as google_router

router = APIRouter()

router.include_router(api_router, prefix="/api")
router.include_router(github_router, prefix="/github")
router.include_router(google_router, prefix="/google")
router.include_router(email_router, prefix="/email")
