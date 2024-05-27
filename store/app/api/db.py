# mypy: disable-error-code="empty-body"
"""Defines base tools for interacting with the database."""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Literal

import aioboto3
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource

from store.settings import settings


@asynccontextmanager
async def get_aio_db() -> AsyncGenerator[DynamoDBServiceResource, None]:
    session = aioboto3.Session()
    async with session.resource(
        "dynamodb",
        endpoint_url=settings.database.endpoint_url,
        region_name=settings.database.region_name,
        aws_access_key_id=settings.database.aws_access_key_id,
        aws_secret_access_key=settings.database.aws_secret_access_key,
    ) as db:
        yield db


async def _create_dynamodb_table(
    db: DynamoDBServiceResource,
    name: str,
    columns: list[tuple[str, Literal["S", "N", "B"]]],
    pks: list[tuple[str, Literal["HASH", "RANGE"]]],
    deletion_protection: bool = False,
    read_capacity_units: int = 2,
    write_capacity_units: int = 2,
    billing_mode: Literal["PROVISIONED", "PAY_PER_REQUEST"] = "PAY_PER_REQUEST",
) -> None:
    table = await db.create_table(
        AttributeDefinitions=[{"AttributeName": n, "AttributeType": t} for n, t in columns],
        TableName=name,
        KeySchema=[{"AttributeName": pk[0], "KeyType": pk[1]} for pk in pks],
        ProvisionedThroughput={"ReadCapacityUnits": read_capacity_units, "WriteCapacityUnits": write_capacity_units},
        OnDemandThroughput={"MaxReadRequestUnits": read_capacity_units, "MaxWriteRequestUnits": write_capacity_units},
        DeletionProtectionEnabled=deletion_protection,
        BillingMode=billing_mode,
    )
    await table.wait_until_exists()


async def create_tables(db: DynamoDBServiceResource | None = None) -> None:
    """Initializes all of the database tables.

    Args:
        db: The DynamoDB database.
    """
    if db is None:
        async with get_aio_db() as db:
            await create_tables(db)
    else:
        await _create_dynamodb_table(
            db=db,
            name="Users",
            columns=[
                ("user_id", "S"),
            ],
            pks=[
                ("user_id", "HASH"),
            ],
        )


if __name__ == "__main__":
    # python -m store.app.api.db
    asyncio.run(create_tables())
