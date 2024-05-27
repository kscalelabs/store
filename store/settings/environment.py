"""Defines the bot environment settings."""

from dataclasses import dataclass, field

from omegaconf import MISSING


@dataclass
class DatabaseSettings:
    endpoint_url: str = field(default=MISSING)
    region_name: str = field(default=MISSING)
    aws_access_key_id: str = field(default=MISSING)
    aws_secret_access_key: str = field(default=MISSING)


@dataclass
class EnvironmentSettings:
    database: DatabaseSettings = field(default_factory=DatabaseSettings)
