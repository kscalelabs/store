"""Defines the base CRUD interface."""

import itertools
import logging
from typing import Any, AsyncContextManager, Literal, Self, TypeVar, overload

import aioboto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource
from types_aiobotocore_s3.service_resource import S3ServiceResource

from store.app.model import RobolistBaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=RobolistBaseModel)

DEFAULT_CHUNK_SIZE = 100
DEFAULT_SCAN_LIMIT = 1000

TableKey = tuple[str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]
GlobalSecondaryIndex = tuple[str, str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]


class BaseCrud(AsyncContextManager["BaseCrud"]):
    def __init__(self) -> None:
        super().__init__()

        self.__db: DynamoDBServiceResource | None = None

    @property
    def db(self) -> DynamoDBServiceResource:
        if self.__db is None:
            raise RuntimeError("Must call __aenter__ first!")
        return self.__db

    @property
    def s3(self) -> S3ServiceResource:
        if self.__s3 is None:
            raise RuntimeError("Must call __aenter__ first!")
        return self.__s3

    @classmethod
    def get_gsis(cls) -> list[GlobalSecondaryIndex]:
        return [
            ("typeIndex", "type", "S", "HASH"),
        ]

    async def __aenter__(self) -> Self:
        session = aioboto3.Session()
        db = session.resource("dynamodb")
        db = await db.__aenter__()
        self.__db = db

        s3 = session.resource("s3")
        s3 = await s3.__aenter__()
        self.__s3 = s3

        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:  # noqa: ANN401
        if self.__db is not None:
            await self.__db.__aexit__(exc_type, exc_val, exc_tb)
        if self.__s3 is not None:
            await self.__s3.__aexit__(exc_type, exc_val, exc_tb)

    async def _add_item(self, item: RobolistBaseModel) -> None:
        table = await self.db.Table("Robolist")
        item_data = item.model_dump()
        if "type" in item_data:
            raise ValueError("Cannot add item with 'type' attribute")
        item_data["type"] = item.__class__.__name__
        await table.put_item(Item=item_data)

    async def _delete_item(self, item: RobolistBaseModel | str) -> None:
        table = await self.db.Table("Robolist")
        if isinstance(item, str):
            await table.delete_item(Key={"id": item})
        else:
            await table.delete_item(Key={"id": item.id})

    async def _list_items(
        self,
        item_class: type[T],
        expression_attribute_names: dict[str, str] | None = None,
        expression_attribute_values: dict[str, Any] | None = None,
        filter_expression: str | None = None,
        offset: int | None = None,
        limit: int = DEFAULT_SCAN_LIMIT,
    ) -> list[T]:
        # table = await self.db.Table("Robolist")
        # item_dict = await table.scan(
        #     IndexName="typeIndex",
        #     Limit=limit,
        #     FilterExpression=Key("type").eq(item_class.__name__),
        # )
        # return [await self._validate_item(item, item_class) for item in item_dict["Items"]]
        table = await self.db.Table("Robolist")
        kwargs = {
            "IndexName": "typeIndex",
            "FilterExpression": Key("type").eq(item_class.__name__),
        }
        if expression_attribute_names is not None:
            kwargs["ExpressionAttributeNames"] = expression_attribute_names
        if expression_attribute_values is not None:
            kwargs["ExpressionAttributeValues"] = expression_attribute_values
        if filter_expression is not None:
            kwargs["FilterExpression"] = filter_expression
        if offset is not None:
            kwargs["ExclusiveStartKey"] = {"id": offset}
        items = []
        while True:
            item_dict = await table.scan(**kwargs)
            items.extend([await self._validate_item(item, item_class) for item in item_dict["Items"]])
            if "LastEvaluatedKey" not in item_dict or len(items) >= limit:
                break
            kwargs["ExclusiveStartKey"] = item_dict["LastEvaluatedKey"]
        return items[:limit]

    async def _count_items(self, item_class: type[T]) -> int:
        table = await self.db.Table("Robolist")
        item_dict = await table.scan(
            IndexName="typeIndex",
            Select="COUNT",
            FilterExpression=Key("type").eq(item_class.__name__),
        )
        return item_dict["Count"]

    async def _validate_item(self, data: dict[str, Any], item_class: type[T]) -> T:
        if (item_type := data.pop("type")) != item_class.__name__:
            raise ValueError(f"Item type {str(item_type)} is not a {item_class.__name__}")
        return item_class.model_validate(data)

    @overload
    async def _get_item(self, item_id: str, item_class: type[T], throw_if_missing: Literal[True]) -> T: ...

    @overload
    async def _get_item(self, item_id: str, item_class: type[T], throw_if_missing: Literal[False]) -> T | None: ...

    async def _get_item(self, item_id: str, item_class: type[T], throw_if_missing: bool = False) -> T | None:
        table = await self.db.Table("Robolist")
        item_dict = await table.get_item(Key={"id": item_id})
        if "Item" not in item_dict:
            if throw_if_missing:
                raise ValueError(f"Item {item_id} not found")
            return None
        item_data = item_dict["Item"]
        return await self._validate_item(item_data, item_class)

    async def _item_exists(self, item_id: str) -> bool:
        table = await self.db.Table("Robolist")
        item_dict = await table.get_item(Key={"id": item_id})
        return "Item" in item_dict

    async def _get_item_batch(
        self,
        item_ids: list[str],
        item_class: type[T],
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ) -> list[T]:
        items: list[T] = []
        for i in range(0, len(item_ids), chunk_size):
            chunk = item_ids[i : i + chunk_size]
            keys = [{"id": item_id} for item_id in chunk]
            response = await self.db.batch_get_item(RequestItems={"Robolist": {"Keys": keys}})
            for item in response["Responses"]["Robolist"]:
                items.append(await self._validate_item(item, item_class))
        return items

    async def _get_items_from_secondary_index(
        self,
        secondary_index: str,
        secondary_index_name: str,
        secondary_index_value: str,
        item_class: type[T],
    ) -> list[T]:
        table = await self.db.Table("Robolist")
        item_dict = await table.query(
            IndexName=secondary_index,
            KeyConditionExpression=Key(secondary_index_name).eq(secondary_index_value),
        )
        items = item_dict["Items"]
        return [await self._validate_item(item, item_class) for item in items]

    async def _update_item(self, item_id: str, item_class: type[T], new_values: dict[str, Any]) -> None:  # noqa: ANN401
        # Validates the new values.
        for field_name, field_value in new_values.items():
            if (field_info := item_class.model_fields.get(field_name)) is None:
                raise ValueError(f"Field {field_name} not in model {item_class.__name__}")
            if field_info.annotation is not None and not isinstance(field_value, field_info.annotation):
                raise ValueError(f"Field {field_name} is not of type {field_info.annotation}")

        # Updates the table.
        table = await self.db.Table("Robolist")
        await table.update_item(
            Key={"id": item_id},
            AttributeUpdates={k: {"Value": v, "Action": "PUT"} for k, v in new_values.items()},
        )

    async def _create_dynamodb_table(
        self,
        name: str,
        keys: list[TableKey],
        gsis: list[GlobalSecondaryIndex] | None = None,
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
            logger.info("Found existing table %s", name)
        except ClientError:
            logger.info("Creating %s table", name)

            if gsis:
                table = await self.db.create_table(
                    AttributeDefinitions=[
                        {"AttributeName": n, "AttributeType": t}
                        for n, t in itertools.chain(((n, t) for (n, t, _) in keys), ((n, t) for _, n, t, _ in gsis))
                    ],
                    TableName=name,
                    KeySchema=[{"AttributeName": n, "KeyType": t} for n, _, t in keys],
                    GlobalSecondaryIndexes=(
                        [
                            {
                                "IndexName": i,
                                "KeySchema": [{"AttributeName": n, "KeyType": t}],
                                "Projection": {"ProjectionType": "ALL"},
                            }
                            for i, n, _, t in gsis
                        ]
                    ),
                    DeletionProtectionEnabled=deletion_protection,
                    BillingMode="PAY_PER_REQUEST",
                )

            else:
                table = await self.db.create_table(
                    AttributeDefinitions=[
                        {"AttributeName": n, "AttributeType": t} for n, t in ((n, t) for (n, t, _) in keys)
                    ],
                    TableName=name,
                    KeySchema=[{"AttributeName": n, "KeyType": t} for n, _, t in keys],
                    DeletionProtectionEnabled=deletion_protection,
                    BillingMode="PAY_PER_REQUEST",
                )

            await table.wait_until_exists()

    async def _delete_dynamodb_table(self, name: str) -> None:
        """Deletes a table in the Dynamo database.

        Args:
            name: Name of the table.
        """
        try:
            table = await self.db.Table(name)
            await table.delete()
            logger.info("Deleted table %s", name)
        except ClientError:
            logger.info("Table %s does not exist", name)
