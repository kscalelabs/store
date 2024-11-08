"""This module provides CRUD operations for teleoperation."""

from boto3.dynamodb.conditions import Key

from store.app.crud.base import BaseCrud
from store.app.model import TeleopICECandidate


class TeleopCrud(BaseCrud):
    """CRUD operations for teleoperation."""

    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"robot_id"})

    async def store_ice_candidate(self, candidate: TeleopICECandidate) -> None:
        await self._add_item(candidate, unique_fields=["user_id", "robot_id"])

    async def get_ice_candidates(self, user_id: str, robot_id: str, limit: int = 1) -> list[TeleopICECandidate]:
        return await self._get_items_from_secondary_index(
            "user_id",
            user_id,
            TeleopICECandidate,
            additional_filter_expression=Key("robot_id").eq(robot_id),
            limit=limit,
        )

    async def delete_ice_candidate(self, candidate: TeleopICECandidate) -> None:
        await self._delete_item(candidate)
