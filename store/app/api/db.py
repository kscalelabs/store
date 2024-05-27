# mypy: disable-error-code="empty-body"
"""Defines base tools for interacting with the database."""

import asyncio
from typing import Any, Literal

import boto3

from store.settings import settings


class Table:
    def put_item(self, *, Item: Any) -> Any: ...  # noqa: N803, ANN401
    def get_item(self, *, Key: Any) -> Any: ...  # noqa: N803, ANN401
    def update_item(self, *, Key: Any, AttributeUpdates: Any) -> Any: ...  # noqa: N803, ANN401
    def wait_until_exists(self) -> None: ...
    @property
    def item_count(self) -> int: ...


class ServiceResource:
    def Table(self, name: str) -> Table: ...  # noqa: N802
    def create_table(self, **kwargs: Any) -> None: ...  # noqa: ANN401


def get_db() -> ServiceResource:
    return boto3.resource(
        "dynamodb",
        endpoint_url=settings.database.endpoint_url,
        region_name=settings.database.region_name,
        aws_access_key_id=settings.database.aws_access_key_id,
        aws_secret_access_key=settings.database.aws_secret_access_key,
    )


async def _create_dynamodb_table(
    db: ServiceResource,
    name: str,
    columns: list[tuple[str, Literal["S", "N", "B"]]],
    pks: list[tuple[str, Literal["HASH", "RANGE"]]],
    deletion_protection: bool = False,
    read_capacity_units: int = 2,
    write_capacity_units: int = 2,
    billing_mode: Literal["PROVISIONED", "PAY_PER_REQUEST"] = "PAY_PER_REQUEST",
) -> None:
    db.create_table(
        AttributeDefinitions=[{"AttributeName": n, "AttributeType": t} for n, t in columns],
        TableName=name,
        KeySchema=[{"AttributeName": pk[0], "KeyType": pk[1]} for pk in pks],
        # LocalSecondaryIndexes=[
        #     {
        #         "IndexName": "string",
        #         "KeySchema": [
        #             {"AttributeName": "string", "KeyType": "HASH" | "RANGE"},
        #         ],
        #         "Projection": {
        #             "ProjectionType": "ALL" | "KEYS_ONLY" | "INCLUDE",
        #             "NonKeyAttributes": [
        #                 "string",
        #             ],
        #         },
        #     },
        # ],
        # GlobalSecondaryIndexes=[
        #     {
        #         "IndexName": "string",
        #         "KeySchema": [
        #             {"AttributeName": "string", "KeyType": "HASH" | "RANGE"},
        #         ],
        #         "Projection": {
        #             "ProjectionType": "ALL" | "KEYS_ONLY" | "INCLUDE",
        #             "NonKeyAttributes": [
        #                 "string",
        #             ],
        #         },
        #         "ProvisionedThroughput": {"ReadCapacityUnits": 123, "WriteCapacityUnits": 123},
        #         "OnDemandThroughput": {"MaxReadRequestUnits": 123, "MaxWriteRequestUnits": 123},
        #     },
        # ],
        # StreamSpecification={
        #     "StreamEnabled": True | False,
        #     "StreamViewType": "NEW_IMAGE" | "OLD_IMAGE" | "NEW_AND_OLD_IMAGES" | "KEYS_ONLY",
        # },
        # SSESpecification={"Enabled": True | False, "SSEType": "AES256" | "KMS", "KMSMasterKeyId": "string"},
        # Tags=[
        #     {"Key": "string", "Value": "string"},
        # ],
        # TableClass="STANDARD" | "STANDARD_INFREQUENT_ACCESS",
        # ResourcePolicy="string",
        ProvisionedThroughput={"ReadCapacityUnits": read_capacity_units, "WriteCapacityUnits": write_capacity_units},
        OnDemandThroughput={"MaxReadRequestUnits": read_capacity_units, "MaxWriteRequestUnits": write_capacity_units},
        DeletionProtectionEnabled=deletion_protection,
        BillingMode=billing_mode,
    )
    db.Table(name).wait_until_exists()


async def create_tables(db: ServiceResource) -> None:
    """Initializes all of the database tables.

    Args:
        db: The DynamoDB database.
    """
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
    asyncio.run(create_tables(get_db()))
