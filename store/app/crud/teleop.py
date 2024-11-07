"""This module provides CRUD operations for teleoperation."""

from datetime import datetime
from typing import Literal, overload

from store.app.crud.base import BaseCrud
from store.app.errors import ItemNotFoundError
from store.app.model import TeleopRoom, User


def user_can_access_room(user: User, room: TeleopRoom) -> bool:
    return room.user_id == user.id


class TeleopCrud(BaseCrud):
    """CRUD operations for teleoperation."""

    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"robot_id"})

    async def create_teleop_room(self, user: User, robot_id: str) -> TeleopRoom:
        room = TeleopRoom.create(user.id, robot_id)
        await self._add_item(room)
        return room

    async def get_teleop_room(self, user: User, robot_id: str) -> TeleopRoom:
        room = await self._get_unique_item_from_secondary_index("robot_id", robot_id, TeleopRoom)
        if room is None or not user_can_access_room(user, room):
            raise ItemNotFoundError("Teleop room not found")
        return room

    async def teleop_room_exists(self, user: User, robot_id: str) -> bool:
        room = await self._get_unique_item_from_secondary_index("robot_id", robot_id, TeleopRoom)
        return room is not None and user_can_access_room(user, room)

    @overload
    async def get_teleop_room_by_id(
        self,
        user: User,
        room_id: str,
        throw_if_missing: Literal[True],
    ) -> TeleopRoom: ...

    @overload
    async def get_teleop_room_by_id(
        self,
        user: User,
        room_id: str,
        throw_if_missing: bool = False,
    ) -> TeleopRoom | None: ...

    async def get_teleop_room_by_id(
        self,
        user: User,
        room_id: str,
        throw_if_missing: bool = False,
    ) -> TeleopRoom | None:
        room = await self._get_item(room_id, TeleopRoom)
        if (not room or not user_can_access_room(user, room)) and throw_if_missing:
            raise ItemNotFoundError("Teleop room not found")
        return room

    async def delete_teleop_room(self, user: User, room: TeleopRoom) -> None:
        if not user_can_access_room(user, room):
            raise ItemNotFoundError("Teleop room not found")
        await self._delete_item(room)

    async def update_sdp_offer(self, user: User, room: TeleopRoom, sdp_offer: str) -> TeleopRoom:
        """Updates the SDP offer for a room and sets status to connecting."""
        if not user_can_access_room(user, room):
            raise ItemNotFoundError("Teleop room not found")
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "sdp_offer": sdp_offer,
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room

    async def update_sdp_answer(self, user: User, room: TeleopRoom, sdp_answer: str) -> TeleopRoom:
        """Updates the SDP answer for a room."""
        if not user_can_access_room(user, room):
            raise ItemNotFoundError("Teleop room not found")
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "sdp_answer": sdp_answer,
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room

    async def add_ice_candidate(self, user: User, room: TeleopRoom, ice_candidate: dict) -> TeleopRoom:
        """Adds an ICE candidate to the room's list of candidates."""
        if not user_can_access_room(user, room):
            raise ItemNotFoundError("Teleop room not found")
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

    async def reset_room(self, user: User, room: TeleopRoom) -> TeleopRoom:
        """Resets the room's WebRTC state."""
        if not user_can_access_room(user, room):
            raise ItemNotFoundError("Teleop room not found")
        await self._update_item(
            id=room.id,
            model_type=TeleopRoom,
            updates={
                "sdp_offer": None,
                "sdp_answer": None,
                "ice_candidates": [],
                "updated_at": int(datetime.now().timestamp()),
            },
        )
        return room
