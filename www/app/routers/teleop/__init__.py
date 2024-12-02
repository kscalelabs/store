"""Defines the teleoperation endpoints for the API."""

from fastapi import APIRouter

from store.app.routers.teleop.webrtc import router as webrtc_router

router = APIRouter()

router.include_router(webrtc_router, prefix="/rtc")
