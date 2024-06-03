"""Defines the table models for the API.

These correspond directly with the rows in our database, and provide helper
methods for converting from our input data into the format the database
expects (for example, converting a UUID into a string).
"""

import uuid
from decimal import Decimal

from pydantic import BaseModel

from store.app.api.crypto import hash_api_key


class User(BaseModel):
    user_id: str  # Primary key
    email: str

    @classmethod
    def from_uuid(cls, user_id: uuid.UUID, email: str) -> "User":
        return cls(user_id=str(user_id), email=email)

    def to_uuid(self) -> uuid.UUID:
        return uuid.UUID(self.user_id)


# Stored in Redis rather than DynamoDB
class ApiKey(BaseModel):
    api_key_hash: str  # Primary key
    user_id: str
    lifetime: int

    @classmethod
    def from_api_key(cls, api_key: uuid.UUID, user_id: uuid.UUID, lifetime: int) -> "ApiKey":
        api_key_hash = hash_api_key(api_key)
        return cls(api_key_hash=api_key_hash, user_id=str(user_id), lifetime=lifetime)


class PurchaseLink(BaseModel):
    name: str
    url: str
    price: Decimal


class Robot(BaseModel):
    robot_id: str  # Primary key
    owner: str
    name: str
    description: str
    price: Decimal
    part_ids: set[str]
    purchase_links: set[PurchaseLink]


class Part(BaseModel):
    part_id: str  # Primary key
    owner: str
    name: str
    description: str
    price: Decimal
    robot_ids: set[str]
    purchase_links: set[PurchaseLink]
