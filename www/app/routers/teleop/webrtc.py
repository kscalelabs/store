# ruff: noqa: N815
"""Defines the router endpoints for teleoperation."""

import asyncio
import time
from typing import Annotated, AsyncIterable

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from www.app.db import Crud
from www.app.model import TeleopICECandidate
from www.app.security.cognito import api_key_header

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
    api_key: Annotated[str, Depends(api_key_header)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    api_key_obj = await crud.get_api_key(api_key)
    if not api_key_obj:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired API key")

    await crud.store_ice_candidate(TeleopICECandidate.create(api_key_obj.user_id, robot_id, candidate))


@router.websocket("/ws/ice-candidates/{robot_id}")
async def websocket_ice_candidates(
    robot_id: str,
    websocket: WebSocket,
    api_key: Annotated[str, Depends(api_key_header)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> None:
    """Defines the WebSocket endpoint for ICE candidates."""
    api_key_obj = await crud.get_api_key(api_key)
    if not api_key_obj:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        async for candidate in ice_candidates_generator(api_key_obj.user_id, robot_id, crud):
            await websocket.send_text(candidate)
    except WebSocketDisconnect:
        pass


@router.get("/poll/ice-candidates/{robot_id}")
async def poll_ice_candidates(
    robot_id: str,
    api_key: Annotated[str, Depends(api_key_header)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> StreamingResponse:
    """Defines the polling endpoint for ICE candidates."""
    api_key_obj = await crud.get_api_key(api_key)
    if not api_key_obj:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired API key")

    return StreamingResponse(
        content=ice_candidates_generator(api_key_obj.user_id, robot_id, crud),
        media_type="text/event-stream",
    )


class CheckAuthResponse(BaseModel):
    user_id: str


@router.get("/check", response_model=CheckAuthResponse)
async def check_auth(
    api_key: Annotated[str, Depends(api_key_header)],
    crud: Annotated[Crud, Depends(Crud.get)],
) -> CheckAuthResponse:
    """Validates the user's API key and returns their user ID."""
    api_key_obj = await crud.get_api_key(api_key)
    if not api_key_obj:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired API key")

    return CheckAuthResponse(user_id=api_key_obj.user_id)
