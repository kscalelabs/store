"""Defines the authentication endpoints for the API."""

from fastapi import APIRouter

from www.app.routers.auth.cognito import router as cognito_router

router = APIRouter()
router.include_router(cognito_router, prefix="/cognito")
