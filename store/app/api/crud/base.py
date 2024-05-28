"""Defines the base CRUD interface."""

from typing import Any, Literal, Self

import aioboto3
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource

from store.settings import settings


class BaseCrud:
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
        db = session.resource(
            "dynamodb",
            endpoint_url=settings.database.endpoint_url,
            region_name=settings.database.region_name,
            aws_access_key_id=settings.database.aws_access_key_id,
            aws_secret_access_key=settings.database.aws_secret_access_key,
        )
        db = await db.__aenter__()
        self.__db = db
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:  # noqa: ANN401
        if self.__db is not None:
            await self.__db.__aexit__(exc_type, exc_val, exc_tb)

    async def _create_dynamodb_table(
        self,
        name: str,
        columns: list[tuple[str, Literal["S", "N", "B"]]],
        pks: list[tuple[str, Literal["HASH", "RANGE"]]],
        deletion_protection: bool = False,
        read_capacity_units: int = 2,
        write_capacity_units: int = 2,
        billing_mode: Literal["PROVISIONED", "PAY_PER_REQUEST"] = "PAY_PER_REQUEST",
    ) -> None:
        table = await self.db.create_table(
            AttributeDefinitions=[{"AttributeName": n, "AttributeType": t} for n, t in columns],
            TableName=name,
            KeySchema=[{"AttributeName": pk[0], "KeyType": pk[1]} for pk in pks],
            ProvisionedThroughput={
                "ReadCapacityUnits": read_capacity_units,
                "WriteCapacityUnits": write_capacity_units,
            },
            OnDemandThroughput={
                "MaxReadRequestUnits": read_capacity_units,
                "MaxWriteRequestUnits": write_capacity_units,
            },
            DeletionProtectionEnabled=deletion_protection,
            BillingMode=billing_mode,
        )
        await table.wait_until_exists()
