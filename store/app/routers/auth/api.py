"""Defines authentication endpoints for API-related activities."""

from typing import Annotated

from fastapi import APIRouter, Depends

from store.app.db import Crud
from store.app.security.requests import get_request_api_key_id

router = APIRouter()


@router.delete("/logout")
async def logout_user_endpoint(
    token: Annotated[str, Depends(get_request_api_key_id)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> bool:
    await crud.delete_api_key(token)
    return True
