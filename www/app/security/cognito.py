"""Defines Cognito authentication utilities."""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from www.app.db import Crud
from www.app.model import User

logger = logging.getLogger(__name__)

# Define API key header scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)


async def get_current_user(api_key: str = Depends(api_key_header), crud: Crud = Depends(Crud.get)) -> User:
    """Validate API key and return user."""
    try:
        # Get user associated with API key
        api_key_obj = await crud.get_api_key(api_key)
        if not api_key_obj:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

        user = await crud.get_user(api_key_obj.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return user

    except Exception as e:
        logger.error("Error in get_current_user: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
