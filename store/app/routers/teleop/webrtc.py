# ruff: noqa: N815
"""Defines the router endpoints for teleoperation."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from store.app.db import Crud


class WebRTCSessionDescription(BaseModel):
    type: Literal["offer", "answer"]
    sdp: str


class ICECandidateData(BaseModel):
    candidate: str
    sdpMLineIndex: int
    sdpMid: str


class WebRTCConnectionData(BaseModel):
    offer: WebRTCSessionDescription
    answer: WebRTCSessionDescription | None = None
    offerCandidates: list[ICECandidateData] = []
    answerCandidates: list[ICECandidateData] = []


class SuccessResponse(BaseModel):
    success: bool


class OfferResponse(BaseModel):
    offer: WebRTCSessionDescription


class AnswerResponse(BaseModel):
    answer: WebRTCSessionDescription


class CandidatesResponse(BaseModel):
    candidates: list[ICECandidateData]


class WebRTCOffer(BaseModel):
    roomId: str
    offer: WebRTCSessionDescription


class WebRTCAnswer(BaseModel):
    roomId: str
    answer: WebRTCSessionDescription


class ICECandidate(BaseModel):
    roomId: str
    candidate: ICECandidateData
    isOffer: bool


webrtc_router = APIRouter()


@webrtc_router.post("/offer")
async def handle_offer(
    offer_data: WebRTCOffer,
    crud: Crud = Depends(Crud.get),
) -> SuccessResponse:
    rooms = await crud.get_teleop_room(offer_data.roomId)
    if not rooms:
        # Create new room if it doesn't exist
        room = await crud.create_teleop_room(offer_data.roomId)
    else:
        room = rooms[0]

    await crud.update_sdp_offer(room, offer_data.offer.sdp)
    return SuccessResponse(success=True)


@webrtc_router.post("/answer")
async def handle_answer(
    answer_data: WebRTCAnswer,
    crud: Crud = Depends(Crud.get),
) -> SuccessResponse:
    rooms = await crud.get_teleop_room(answer_data.roomId)
    if not rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[0]
    await crud.update_sdp_answer(room, answer_data.answer.sdp)
    await crud.update_connection_status(room, "connected")
    return SuccessResponse(success=True)


@webrtc_router.get("/offer/{room_id}")
async def get_offer(
    room_id: str,
    crud: Crud = Depends(Crud.get),
) -> OfferResponse:
    rooms = await crud.get_teleop_room(room_id)
    if not rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    connection_data = WebRTCConnectionData.model_validate_json(rooms[0].connection_data)
    return OfferResponse(offer=connection_data.offer)


@webrtc_router.get("/answer/{room_id}")
async def get_answer(
    room_id: str,
    crud: Crud = Depends(Crud.get),
) -> AnswerResponse:
    rooms = await crud.get_teleop_room(room_id)
    if not rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    connection_data = WebRTCConnectionData.model_validate_json(rooms[0].connection_data)
    return AnswerResponse(answer=connection_data.answer)


@webrtc_router.post("/ice-candidate")
async def handle_ice_candidate(
    candidate_data: ICECandidate,
    crud: Crud = Depends(Crud.get),
) -> SuccessResponse:
    rooms = await crud.get_teleop_room(candidate_data.roomId)
    if not rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = rooms[0]
    await crud.add_ice_candidate(room, candidate_data.candidate.model_dump())
    return SuccessResponse(success=True)


@webrtc_router.get("/ice-candidates/{room_id}")
async def get_ice_candidates(
    room_id: str,
    is_offer: bool = True,
    crud: Crud = Depends(Crud.get),
) -> CandidatesResponse:
    rooms = await crud.get_teleop_room(room_id)
    if not rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    connection_data = WebRTCConnectionData.model_validate_json(rooms[0].connection_data)
    candidates = connection_data.offerCandidates if is_offer else connection_data.answerCandidates
    return CandidatesResponse(candidates=candidates)


@webrtc_router.post("/clear/{room_id}")
async def clear_room(
    room_id: str,
    crud: Crud = Depends(Crud.get),
) -> SuccessResponse:
    rooms = await crud.get_teleop_room(room_id)
    if rooms:
        room = rooms[0]
        await crud.reset_room(room)
    return SuccessResponse(success=True)
