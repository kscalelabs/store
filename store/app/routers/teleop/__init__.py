"""Defines the teleoperation endpoints for the API."""

from fastapi import APIRouter

from store.app.routers.teleop.webrtc import webrtc_router

teleop_router = APIRouter()

teleop_router.include_router(webrtc_router, prefix="/rtc")
