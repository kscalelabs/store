"""This module provides CRUD operations for teleoperation."""

from boto3.dynamodb.conditions import Key

from store.app.crud.base import BaseCrud
from store.app.model import TeleopICECandidate


class TeleopCrud(BaseCrud):
    """CRUD operations for teleoperation."""

    @classmethod
    def get_gsis(cls) -> set[str]:
        return super().get_gsis().union({"robot_id"})

    def store_ice_candidate(self, candidate: TeleopICECandidate) -> None:
        self._add_item(candidate, unique_fields=["user_id", "robot_id"])

    def get_ice_candidates(self, user_id: str, robot_id: str, limit: int = 1) -> list[TeleopICECandidate]:
        return self._get_items_from_secondary_index(
            "user_id",
            user_id,
            TeleopICECandidate,
            additional_filter_expression=Key("robot_id").eq(robot_id),
            limit=limit,
        )

    def delete_ice_candidate(self, candidate: TeleopICECandidate) -> None:
        self._delete_item(candidate)
