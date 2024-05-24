# mypy: disable-error-code="var-annotated"
"""Defines the table models for the API."""

from tortoise import fields
from tortoise.models import Model


class User(Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True, index=True)
    banned = fields.BooleanField(default=False)
    deleted = fields.BooleanField(default=False)


class Token(Model):
    id = fields.IntField(pk=True)
    user: fields.ForeignKeyRelation[User] = fields.ForeignKeyField(
        "models.User",
        related_name="tokens",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    issued = fields.DatetimeField(auto_now_add=True)
    disabled = fields.BooleanField(default=False)
