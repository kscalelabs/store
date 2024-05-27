"""Defines the API endpoint for creating, deleting and updating user information."""

import logging

from fastapi import APIRouter

logger = logging.getLogger(__name__)

api_router = APIRouter()
