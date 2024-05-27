"""Defines the bot environment settings."""

from dataclasses import dataclass, field

from omegaconf import MISSING


@dataclass
class CryptoSettings:
    expire_token_minutes: int = field(default=10)


@dataclass
class UserSettings:
    authorized_emails: list[str] | None = field(default=None)
    admin_emails: list[str] = field(default_factory=lambda: [])


@dataclass
class DatabaseSettings:
    endpoint_url: str = field(default=MISSING)
    region_name: str = field(default=MISSING)
    aws_access_key_id: str = field(default=MISSING)
    aws_secret_access_key: str = field(default=MISSING)


@dataclass
class EnvironmentSettings:
    database: DatabaseSettings = field(default_factory=DatabaseSettings)
    user: UserSettings = field(default_factory=UserSettings)
    crypto: CryptoSettings = field(default_factory=CryptoSettings)
    debug: bool = field(default=False)
