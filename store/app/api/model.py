# mypy: disable-error-code="var-annotated"
"""Defines the table models for the API."""

import enum

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


class AudioSource(enum.Enum):
    uploaded = "uploaded"
    recorded = "recorded"
    generated = "generated"


def cast_audio_source(s: str) -> AudioSource:
    match s:
        case "uploaded":
            return AudioSource.uploaded
        case "recorded":
            return AudioSource.recorded
        case "generated":
            return AudioSource.generated
        case _:
            raise ValueError(f"Invalid audio source {s}")


class Audio(Model):
    id = fields.IntField(pk=True)
    key = fields.UUIDField(unique=True, index=True)
    name = fields.CharField(max_length=255, index=True)
    user: fields.ForeignKeyRelation[User] = fields.ForeignKeyField(
        "models.User",
        related_name="audios",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    source = fields.CharEnumField(enum_type=AudioSource, index=True)
    created = fields.DatetimeField(auto_now_add=True)
    num_frames = fields.IntField()
    num_channels = fields.IntField()
    sample_rate = fields.IntField()
    duration = fields.FloatField()
    public = fields.BooleanField(default=False)


class AudioDeleteTask(Model):
    id = fields.IntField(pk=True)
    key = fields.UUIDField(unique=True, index=True)


class Generation(Model):
    id = fields.IntField(pk=True)
    user: fields.ForeignKeyRelation[User] = fields.ForeignKeyField(
        "models.User",
        related_name="generations",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    source: fields.ForeignKeyRelation[Audio] = fields.ForeignKeyField(
        "models.Audio",
        related_name="generations_as_source",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    reference: fields.ForeignKeyRelation[Audio] = fields.ForeignKeyField(
        "models.Audio",
        related_name="generations_as_reference",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    output: fields.ForeignKeyRelation[Audio] = fields.ForeignKeyField(
        "models.Audio",
        related_name="generations_as_output",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    model = fields.CharField(max_length=255, index=True)
    elapsed_time = fields.FloatField()
    task_finished = fields.DatetimeField(auto_now_add=True)
    public = fields.BooleanField(default=False)


class Task(Model):
    # When a user is deleted, we delete all their tasks as well, to avoid
    # accidentally associating the task with a different user.
    user: fields.ForeignKeyRelation[User] = fields.ForeignKeyField(
        "models.User",
        related_name="tasks",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    # When a generation is deleted, we keep the task around for accounting
    # purposes, but we set the generation to null.
    generation: fields.ForeignKeyNullableRelation[Generation] = fields.ForeignKeyField(
        "models.Generation",
        related_name="tasks",
        on_delete=fields.SET_NULL,
        index=True,
        null=True,
    )
    model = fields.CharField(max_length=255, index=True)
    elapsed_time = fields.FloatField()
    task_finished = fields.DatetimeField(auto_now_add=True)


class Collection(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255, index=True)
    user: fields.ForeignKeyRelation[User] = fields.ForeignKeyField(
        "models.User",
        related_name="collections",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
    audio: fields.ForeignKeyRelation[Audio] = fields.ForeignKeyField(
        "models.Audio",
        related_name="collections",
        on_delete=fields.CASCADE,
        index=True,
        null=False,
    )
