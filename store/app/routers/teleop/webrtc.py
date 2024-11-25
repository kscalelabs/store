# ruff: noqa: N815
"""Defines the router endpoints for teleoperation."""

import asyncio
import time
from typing import Annotated, AsyncIterable

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from store.app.db import Crud
from store.app.model import TeleopICECandidate, User
from store.app.security.user import get_session_user_with_write_permission

router = APIRouter()

MAX_ICE_CANDIDATES = 1


async def ice_candidates_generator(
    user_id: str,
    robot_id: str,
    crud: Crud,
    max_candidates: int = MAX_ICE_CANDIDATES,
) -> AsyncIterable[str]:
    num_candidates = 0
    prev_time = time.time()
    while True:
        ice_candidates = await crud.get_ice_candidates(user_id, robot_id)
        for candidate in ice_candidates:
            yield candidate.candidate
            num_candidates += 1
            if num_candidates >= max_candidates:
                break

        # Sleep until the next second.
        next_time = time.time()
        await asyncio.sleep(1 - (next_time - prev_time))
        prev_time = next_time


@router.post("/store/{robot_id}")
async def store_ice_candidate(
    robot_id: str,
    candidate: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    await crud.store_ice_candidate(TeleopICECandidate.create(user.id, robot_id, candidate))


@router.websocket("/ws/ice-candidates/{robot_id}")
async def websocket_ice_candidates(
    robot_id: str,
    websocket: WebSocket,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    """Defines the WebSocket endpoint for ICE candidates."""
    try:
        async for candidate in ice_candidates_generator(user.id, robot_id, crud):
            await websocket.send_text(candidate)
    except WebSocketDisconnect:
        pass


@router.get("/poll/ice-candidates/{robot_id}")
async def poll_ice_candidates(
    robot_id: str,
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> StreamingResponse:
    """Defines the polling endpoint for ICE candidates."""
    return StreamingResponse(
        content=ice_candidates_generator(user.id, robot_id, crud),
        media_type="text/event-stream",
    )


class CheckAuthResponse(BaseModel):
    user_id: str


@router.get("/check", response_model=CheckAuthResponse)
async def check_auth(
    user: Annotated[User, Depends(get_session_user_with_write_permission)],
) -> CheckAuthResponse:
    """Validates the user's API key and returns their user ID."""
    return CheckAuthResponse(user_id=user.id)
