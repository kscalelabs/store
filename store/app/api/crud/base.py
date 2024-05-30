"""Defines the base CRUD interface."""

import itertools
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

		"""Creates a table in the Dynamo database.

		Args:
			name: Name of the table.
			keys: Primary and secondary keys. Do not include non-key attributes.
			gsis: Making an attribute a GSI is required in oredr to query against it.
				Note HASH on a GSI does not actually enforce uniqueness.
				Instead, the difference is: you cannot query RANGE fields alone but you may query HASH fields
			deletion_protection: Whether the table is protected from being deleted.
		"""
    async def _create_dynamodb_table(
        self,
        name: str,
        keys: list[tuple[str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]],
        gsis: list[tuple[str, str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]] = [],
        deletion_protection: bool = False,
    ) -> None:
        table = await self.db.create_table(
            AttributeDefinitions=[
                {"AttributeName": n, "AttributeType": t}
                for n, t in itertools.chain(((n, t) for (n, t, _) in keys), ((n, t) for _, n, t, _ in gsis))
            ],
            TableName=name,
            KeySchema=[{"AttributeName": n, "KeyType": t} for n, _, t in keys],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": i,
                    "KeySchema": [{"AttributeName": n, "KeyType": t}],
                    "Projection": {"ProjectionType": "ALL"},
                }
                for i, n, _, t in gsis
            ],
            DeletionProtectionEnabled=deletion_protection,
            BillingMode="PAY_PER_REQUEST",
        )
        await table.wait_until_exists()
