"""This module provides CRUD operations for teleoperation."""

from datetime import datetime
from typing import Literal, overload

from store.app.crud.base import BaseCrud
from store.app.errors import ItemNotFoundError
from store.app.model import TeleopRoom


class TeleopCrud(BaseCrud):
    """CRUD operations for teleoperation."""

    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"robot_id"})

    async def create_teleop_room(self, robot_id: str) -> TeleopRoom:
        room = TeleopRoom.create(robot_id)
        await self._add_item(room)
        return room

    async def get_teleop_room(self, robot_id: str) -> list[TeleopRoom]:
        rooms = await self._get_items_from_secondary_index("robot_id", robot_id, TeleopRoom)
        return rooms

    @overload
    async def get_teleop_room_by_id(self, room_id: str, throw_if_missing: Literal[True]) -> TeleopRoom: ...

    @overload
    async def get_teleop_room_by_id(self, room_id: str, throw_if_missing: bool = False) -> TeleopRoom | None: ...

    async def get_teleop_room_by_id(self, room_id: str, throw_if_missing: bool = False) -> TeleopRoom | None:
        room = await self._get_item(room_id, TeleopRoom)
        if not room and throw_if_missing:
            raise ItemNotFoundError("Teleop room not found")
        return room

    async def delete_teleop_room(self, room: TeleopRoom) -> None:
        await self._delete_item(room)

    async def update_sdp_offer(self, room: TeleopRoom, sdp_offer: str) -> TeleopRoom:
        """Updates the SDP offer for a room and sets status to connecting."""
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "sdp_offer": sdp_offer,
                "connection_status": "connecting",
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room

    async def update_sdp_answer(self, room: TeleopRoom, sdp_answer: str) -> TeleopRoom:
        """Updates the SDP answer for a room."""
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "sdp_answer": sdp_answer,
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room

    async def add_ice_candidate(self, room: TeleopRoom, ice_candidate: dict) -> TeleopRoom:
        """Adds an ICE candidate to the room's list of candidates."""
        ice_candidates = [] if room.ice_candidates is None else room.ice_candidates
        ice_candidates.append(ice_candidate)
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "ice_candidates": ice_candidates,
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room

    async def update_connection_status(
        self, room: TeleopRoom, status: Literal["disconnected", "connecting", "connected"]
    ) -> TeleopRoom:
        """Updates the connection status of the room."""
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "connection_status": status,
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room

    async def set_ice_servers(self, room: TeleopRoom, ice_servers: list[dict]) -> TeleopRoom:
        """Sets the STUN/TURN server configurations for the room."""
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "ice_servers": ice_servers,
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room

    async def reset_room(self, room: TeleopRoom) -> TeleopRoom:
        """Resets the room's WebRTC state."""
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "sdp_offer": None,
                "sdp_answer": None,
                "ice_candidates": [],
                "connection_status": "disconnected",
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room
