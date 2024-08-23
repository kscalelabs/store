"""Defines the base CRUD interface."""

import asyncio
import itertools
import logging
from typing import (
    IO,
    Any,
    AsyncContextManager,
    Callable,
    Literal,
    Self,
    TypeVar,
    overload,
)

import aioboto3
from aiobotocore.response import StreamingBody
from boto3.dynamodb.conditions import Attr, ComparisonCondition, Key
from botocore.exceptions import ClientError
from types_aiobotocore_dynamodb.service_resource import DynamoDBServiceResource
from types_aiobotocore_s3.service_resource import S3ServiceResource

from store.app.errors import InternalError, ItemNotFoundError
from store.app.model import StoreBaseModel
from store.settings import settings
from store.utils import get_cors_origins

TABLE_NAME = settings.dynamo.table_name

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=StoreBaseModel)

DEFAULT_CHUNK_SIZE = 100
DEFAULT_SCAN_LIMIT = 1000
ITEMS_PER_PAGE = 12

TableKey = tuple[str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]
GlobalSecondaryIndex = tuple[str, str, Literal["S", "N", "B"], Literal["HASH", "RANGE"]]


class BaseCrud(AsyncContextManager["BaseCrud"]):
    def __init__(self) -> None:
        super().__init__()

        self.__db: DynamoDBServiceResource | None = None
        self.__s3: S3ServiceResource | None = None

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
    def get_gsis(cls) -> set[str]:
        return {"type"}

    @classmethod
    def get_gsi_index_name(cls, colname: str) -> str:
        return f"{colname}_index"

    async def __aenter__(self) -> Self:
        session = aioboto3.Session()
        db = session.resource("dynamodb")
        s3 = session.resource("s3")
        db, s3 = await asyncio.gather(db.__aenter__(), s3.__aenter__())
        self.__db = db
        self.__s3 = s3
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:  # noqa: ANN401
        to_close = []
        if self.__db is not None:
            to_close.append(self.__db)
        if self.__s3 is not None:
            to_close.append(self.__s3)
        await asyncio.gather(*(resource.__aexit__(exc_type, exc_val, exc_tb) for resource in to_close))

    async def _add_item(self, item: StoreBaseModel, unique_fields: list[str] | None = None) -> None:
        table = await self.db.Table(TABLE_NAME)
        item_data = item.model_dump()

        # Ensure no empty strings are present
        item_data = {k: v for k, v in item_data.items() if v is not None and v != ""}

        # DynamoDB-specific requirements
        if "type" in item_data:
            raise InternalError("Cannot add item with 'type' attribute")
        item_data["type"] = item.__class__.__name__

        # Prepare the condition expression
        condition = "attribute_not_exists(id)"
        if unique_fields:
            for field in unique_fields:
                assert hasattr(item, field), f"Item does not have field {field}"
            condition += " AND " + " AND ".join(f"attribute_not_exists({field})" for field in unique_fields)

        # Log the item data before insertion for debugging purposes
        logger.info("Inserting item into DynamoDB: %s", item_data)

        try:
            await table.put_item(
                Item=item_data,
                ConditionExpression=condition,
            )
        except ClientError:
            logger.exception("Failed to insert item into DynamoDB")
            raise

    async def _delete_item(self, item: StoreBaseModel | str) -> None:
        table = await self.db.Table(TABLE_NAME)
        await table.delete_item(Key={"id": item if isinstance(item, str) else item.id})

    async def _list_items(
        self,
        item_class: type[T],
        expression_attribute_names: dict[str, str] | None = None,
        expression_attribute_values: dict[str, Any] | None = None,
        filter_expression: str | None = None,
        offset: int | None = None,
        limit: int = DEFAULT_SCAN_LIMIT,
    ) -> list[T]:
        table = await self.db.Table(TABLE_NAME)

        query_params = {
            "IndexName": "type_index",
            "KeyConditionExpression": Key("type").eq(item_class.__name__),
            "Limit": limit,
        }

        if expression_attribute_names:
            query_params["ExpressionAttributeNames"] = expression_attribute_names
        if expression_attribute_values:
            query_params["ExpressionAttributeValues"] = expression_attribute_values
        if filter_expression:
            query_params["FilterExpression"] = filter_expression
        if offset:
            query_params["ExclusiveStartKey"] = {"id": offset}

        items = (await table.query(**query_params))["Items"]
        return [self._validate_item(item, item_class) for item in items]

    async def _list(
        self,
        item_class: type[T],
        page: int,
        sort_key: Callable[[T], int] | None = None,
        search_query: str | None = None,
    ) -> tuple[list[T], bool]:
        """Lists items of a given class.

        Args:
            item_class: The class of the items to list.
            page: The page number to list.
            sort_key: A function that returns the sort key for an item.
            search_query: A query string to filter items by.

        Returns:
            A tuple of the items on the page and a boolean indicating whether
            there are more pages.
        """
        if search_query:
            response = await self._list_items(
                item_class,
                filter_expression="contains(#part_name, :query) OR contains(description, :query)",
                expression_attribute_names={"#part_name": "name"},
                expression_attribute_values={":query": search_query},
            )
        else:
            response = await self._list_items(item_class)
        if sort_key is not None:
            response = sorted(response, key=sort_key, reverse=True)
        return response[(page - 1) * ITEMS_PER_PAGE : page * ITEMS_PER_PAGE], page * ITEMS_PER_PAGE < len(response)

    async def _list_me(
        self,
        item_class: type[T],
        user_id: str,
        page: int,
        sort_key: Callable[[T], int],
        search_query: str | None = None,
    ) -> tuple[list[T], bool]:
        if search_query:
            response = await self._list_items(
                item_class,
                filter_expression="(contains(#p_name, :query) OR contains(description, :query)) AND #p_owner=:user_id",
                expression_attribute_names={"#p_name": "name", "#p_owner": "user_id"},
                expression_attribute_values={":query": search_query, ":user_id": user_id},
            )
        else:
            response = await self._list_items(
                item_class,
                filter_expression="#p_owner=:user_id",
                expression_attribute_values={":user_id": user_id},
                expression_attribute_names={"#p_owner": "user_id"},
            )
        sorted_items = sorted(response, key=sort_key, reverse=True)
        return sorted_items[(page - 1) * ITEMS_PER_PAGE : page * ITEMS_PER_PAGE], page * ITEMS_PER_PAGE < len(response)

    async def _count_items(self, item_class: type[T]) -> int:
        table = await self.db.Table(TABLE_NAME)
        item_dict = await table.scan(
            IndexName="type_index",
            Select="COUNT",
            FilterExpression=Key("type").eq(item_class.__name__),
        )
        return item_dict["Count"]

    def _validate_item(self, data: dict[str, Any], item_class: type[T]) -> T:
        if (item_type := data.pop("type")) != item_class.__name__:
            raise InternalError(f"Item type {str(item_type)} is not a {item_class.__name__}")
        return item_class.model_validate(data)

    @overload
    async def _get_item(self, item_id: str, item_class: type[T], throw_if_missing: Literal[True]) -> T: ...

    @overload
    async def _get_item(self, item_id: str, item_class: type[T], throw_if_missing: bool = False) -> T | None: ...

    async def _get_item(self, item_id: str, item_class: type[T], throw_if_missing: bool = False) -> T | None:
        table = await self.db.Table(TABLE_NAME)
        item_dict = await table.get_item(Key={"id": item_id})
        if "Item" not in item_dict:
            if throw_if_missing:
                raise ItemNotFoundError
            return None
        item_data = item_dict["Item"]
        return self._validate_item(item_data, item_class)

    async def _item_exists(self, item_id: str) -> bool:
        table = await self.db.Table(TABLE_NAME)
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
            response = await self.db.batch_get_item(RequestItems={TABLE_NAME: {"Keys": keys}})

            # Maps the items to their IDs to return them in the correct order.
            item_ids_to_items: dict[str, T] = {}
            for item in response["Responses"][TABLE_NAME]:
                item_impl = self._validate_item(item, item_class)
                item_ids_to_items[item_impl.id] = item_impl
            items += [item_ids_to_items[item_id] for item_id in chunk]

        return items

    async def _get_items_from_secondary_index(
        self,
        secondary_index_name: str,
        secondary_index_value: str,
        item_class: type[T],
        additional_filter_expression: ComparisonCondition | None = None,
    ) -> list[T]:
        filter_expression: ComparisonCondition = Key("type").eq(item_class.__name__)
        if additional_filter_expression is not None:
            filter_expression &= additional_filter_expression
        table = await self.db.Table(TABLE_NAME)
        item_dict = await table.query(
            IndexName=self.get_gsi_index_name(secondary_index_name),
            KeyConditionExpression=Key(secondary_index_name).eq(secondary_index_value),
            FilterExpression=filter_expression,
        )
        items = item_dict["Items"]
        return [self._validate_item(item, item_class) for item in items]

    async def _get_items_from_secondary_index_batch(
        self,
        secondary_index_name: str,
        secondary_index_values: list[str],
        item_class: type[T],
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ) -> list[list[T]]:
        items: list[list[T]] = []
        table = await self.db.Table(TABLE_NAME)

        for i in range(0, len(secondary_index_values), chunk_size):
            chunk = secondary_index_values[i : i + chunk_size]
            response = await table.scan(
                IndexName=self.get_gsi_index_name(secondary_index_name),
                FilterExpression=(Attr(secondary_index_name).is_in(chunk) & Attr("type").eq(item_class.__name__)),
            )

            # Maps the items to their IDs.
            chunk_items = [self._validate_item(item, item_class) for item in response["Items"]]
            chunk_ids_to_items: dict[str, list[T]] = {}
            for item in chunk_items:
                item_id = getattr(item, secondary_index_name)
                if item_id in chunk_ids_to_items:
                    chunk_ids_to_items[item_id].append(item)
                else:
                    chunk_ids_to_items[item_id] = [item]

            # Adds the items to the list.
            items += [chunk_ids_to_items.get(id, []) for id in chunk]

        return items

    @overload
    async def _get_unique_item_from_secondary_index(
        self,
        secondary_index_name: str,
        secondary_index_value: str,
        item_class: type[T],
        throw_if_missing: Literal[True],
    ) -> T: ...

    @overload
    async def _get_unique_item_from_secondary_index(
        self,
        secondary_index_name: str,
        secondary_index_value: str,
        item_class: type[T],
        throw_if_missing: bool = False,
    ) -> T | None: ...

    async def _get_unique_item_from_secondary_index(
        self,
        secondary_index_name: str,
        secondary_index_value: str,
        item_class: type[T],
        throw_if_missing: bool = False,
    ) -> T | None:
        if secondary_index_name not in item_class.model_fields:
            raise InternalError(f"Field '{secondary_index_name}' not in model {item_class.__name__}")
        items = await self._get_items_from_secondary_index(
            secondary_index_name,
            secondary_index_value,
            item_class,
        )
        if len(items) == 0:
            if throw_if_missing:
                raise InternalError(f"No items found with {secondary_index_name} {secondary_index_value}")
            return None
        if len(items) > 1:
            raise InternalError(f"Multiple items found with {secondary_index_name} {secondary_index_value}")
        return items[0]

    async def _update_item(self, item_id: str, item_class: type[T], new_values: dict[str, Any]) -> None:  # noqa: ANN401
        # Validates the new values.
        for field_name in new_values.keys():
            if item_class.model_fields.get(field_name) is None:
                raise InternalError(f"Field {field_name} not in model {item_class.__name__}")

        # Updates the table.
        table = await self.db.Table(TABLE_NAME)
        await table.update_item(
            Key={"id": item_id},
            AttributeUpdates={k: {"Value": v, "Action": "PUT"} for k, v in new_values.items() if k != "id"},
        )

    async def _upload_to_s3(self, data: IO[bytes], name: str, filename: str, content_type: str) -> None:
        """Uploads some data to S3.

        Args:
            data: The data to upload to S3.
            name: The filename you want users who download the artifact to receive.
            filename: The resulting filename in S3 (should be unique).
            content_type: The file content type, for CloudFront to provide
                in the file header when the user retrieves it.
        """
        bucket = await self.s3.Bucket(settings.s3.bucket)
        try:
            await bucket.put_object(
                Key=f"{settings.s3.prefix}{filename}",
                Body=data,
                ContentType=content_type,
                ContentDisposition=f'attachment; filename="{name}"',
            )
        except ClientError:
            logger.exception(f"Failed to upload {filename} to S3")
            raise

    async def _download_from_s3(self, filename: str) -> StreamingBody:
        """Downloads an object from S3.

        Args:
            filename: The filename of the object to download.

        Returns:
            The object data.
        """
        bucket = await self.s3.Bucket(settings.s3.bucket)
        obj = await bucket.Object(f"{settings.s3.prefix}{filename}")
        data = await obj.get()
        return data["Body"]

    async def _delete_from_s3(self, filename: str) -> None:
        """Deletes an object from S3.

        Args:
            filename: The filename of the object to delete.
        """
        bucket = await self.s3.Bucket(settings.s3.bucket)
        await bucket.delete_objects(Delete={"Objects": [{"Key": f"{settings.s3.prefix}{filename}"}]})

    async def _create_s3_bucket(self) -> None:
        """Creates an S3 bucket if it does not already exist."""
        try:
            await self.s3.meta.client.head_bucket(Bucket=settings.s3.bucket)
            logger.info("Found existing bucket %s", settings.s3.bucket)
        except ClientError:
            logger.info("Creating %s bucket", settings.s3.bucket)
            await self.s3.create_bucket(Bucket=settings.s3.bucket)

            logger.info("Updating %s CORS configuration", settings.s3.bucket)
            s3_cors = await self.s3.BucketCors(settings.s3.bucket)
            await s3_cors.put(
                CORSConfiguration={
                    "CORSRules": [
                        {
                            "AllowedHeaders": ["*"],
                            "AllowedMethods": ["GET"],
                            "AllowedOrigins": get_cors_origins(),
                            "ExposeHeaders": ["ETag"],
                        }
                    ]
                },
            )

    async def _delete_s3_bucket(self) -> None:
        """Deletes an S3 bucket."""
        bucket = await self.s3.Bucket(settings.s3.bucket)
        logger.info("Deleting bucket %s", settings.s3.bucket)
        async for obj in bucket.objects.all():
            await obj.delete()
        await bucket.delete()

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
