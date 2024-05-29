"""Defines the base CRUD interface."""

from typing import Any, AsyncContextManager, Literal, Self

import aioboto3
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource


class BaseCrud(AsyncContextManager["BaseCrud"]):
    def __init__(self) -> None:
        super().__init__()

        self.__db: DynamoDBServiceResource | None = None

    @property
    def db(self) -> DynamoDBServiceResource:
        if self.__db is None:
            raise RuntimeError("Must call __aenter__ first!")
        return self.__db

    async def __aenter__(self) -> Self:
        session = aioboto3.Session()
        db = session.resource("dynamodb")
        db = await db.__aenter__()
        self.__db = db
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:  # noqa: ANN401
        if self.__db is not None:
            await self.__db.__aexit__(exc_type, exc_val, exc_tb)

    async def _create_dynamodb_table(
        self,
        name: str,
        keys: list[tuple[str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]],
        deletion_protection: bool = False,
    ) -> None:
        table = await self.db.create_table(
            AttributeDefinitions=[{"AttributeName": n, "AttributeType": t} for n, t, _ in keys],
            TableName=name,
            KeySchema=[{"AttributeName": n, "KeyType": t} for n, _, t in keys],
            DeletionProtectionEnabled=deletion_protection,
            BillingMode="PAY_PER_REQUEST",
        )
        await table.wait_until_exists()
