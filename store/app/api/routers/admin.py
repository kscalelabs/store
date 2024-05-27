"""Defines the API endpoint for taking admin actions."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic.main import BaseModel

from store.app.api.crud.users import get_user
from store.app.api.db import ServiceResource, get_db
from store.app.api.model import User
from store.app.api.routers.users import SessionTokenData, get_session_token
from store.settings import settings

admin_router = APIRouter()


async def is_admin(user_obj: User) -> bool:
    email = user_obj.email
    return email in settings.user.admin_emails


async def assert_is_admin(
    token_data: SessionTokenData = Depends(get_session_token),
    db: ServiceResource = Depends(get_db),
) -> SessionTokenData:
    admin_user_obj = await get_user(user_id=token_data.user_id, db=db)

    # Validates that the logged in user can take admin actions.
    if not admin_user_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin user not found")
    if not await is_admin(admin_user_obj):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorized")

    return token_data


@admin_router.get("/check")
async def admin_check(token_data: SessionTokenData = Depends(get_session_token)) -> bool:
    user_obj = await User.get_or_none(id=token_data.user_id)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    return await is_admin(user_obj)


class AdminUserRequest(BaseModel):
    email: str
    banned: bool | None = None
    deleted: bool | None = None


class AdminUserResponse(BaseModel):
    banned: bool
    deleted: bool


@admin_router.post("/act/user")
async def admin_act_user(
    data: AdminUserRequest,
    token_data: SessionTokenData = Depends(assert_is_admin),
) -> AdminUserResponse:
    user_obj = await User.get_or_none(email=data.email)
    if user_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    changed = False
    if data.banned is not None and user_obj.banned != data.banned:
        user_obj.banned = data.banned
        changed = True
    if data.deleted is not None and user_obj.deleted != data.deleted:
        user_obj.deleted = data.deleted
        changed = True
    if changed:
        await user_obj.save()
    return AdminUserResponse(banned=user_obj.banned, deleted=user_obj.deleted)
