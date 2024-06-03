"""Defines the base CRUD interface."""

import itertools
import logging
from typing import Any, AsyncContextManager, Literal, Self

import aioboto3
from botocore.exceptions import ClientError
from redis import Redis
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource

from store.settings import settings

from store.settings import settings

logger = logging.getLogger(__name__)


class BaseCrud(AsyncContextManager["BaseCrud"]):
    def __init__(self) -> None:
        super().__init__()

        self.__db: DynamoDBServiceResource | None = None
        self.__kv: Redis | None = None

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

        self.kv = Redis(
            host=settings.redis.host,
            password=settings.redis.password,
            port=settings.redis.port,
            db=settings.redis.db,
        )
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:  # noqa: ANN401
        if self.__db is not None:
            await self.__db.__aexit__(exc_type, exc_val, exc_tb)

    async def _create_dynamodb_table(
        self,
        name: str,
        keys: list[tuple[str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]],
        gsis: list[tuple[str, str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]] = [],
        deletion_protection: bool = False,
    ) -> None:
        """Creates a table in the Dynamo database if a table of that name does not already exist.

        Args:
            name: Name of the table.
            keys: Primary and secondary keys. Do not include non-key attributes.
            gsis: Making an attribute a GSI is required in order to query
                against it. Note HASH on a GSI does not actually enforce
                uniqueness. Instead, the difference is: you cannot query
                RANGE fields alone, but you may query HASH fields.
            deletion_protection: Whether the table is protected from being
                deleted.
        """
        try:
            await self.db.meta.client.describe_table(TableName=name)
        except ClientError:
            logger.info("Creating %s table", name)
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
