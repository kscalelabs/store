"""Defines the bot environment settings."""

from dataclasses import dataclass, field

from omegaconf import II, MISSING


@dataclass
class RedisSettings:
    host: str = field(default=II("oc.env:ROBOLIST_REDIS_HOST,127.0.0.1"))
    password: str = field(default=II("oc.env:ROBOLIST_REDIS_PASSWORD,"))
    port: int = field(default=6379)
    db: int = field(default=0)


@dataclass
class CryptoSettings:
    expire_token_minutes: int = field(default=10)
    expire_otp_minutes: int = field(default=10)
    jwt_secret: str = field(default=MISSING)
    algorithm: str = field(default="HS256")


@dataclass
class UserSettings:
    authorized_emails: list[str] | None = field(default=None)
    admin_emails: list[str] = field(default_factory=lambda: [])


@dataclass
class EmailSettings:
    host: str = field(default=II("oc.env:ROBOLIST_SMTP_HOST"))
    port: int = field(default=587)
    username: str = field(default=II("oc.env:ROBOLIST_SMTP_USERNAME"))
    password: str = field(default=II("oc.env:ROBOLIST_SMTP_PASSWORD"))
    sender_email: str = field(default=II("oc.env:ROBOLIST_SMTP_SENDER_EMAIL"))
    sender_name: str = field(default=II("oc.env:ROBOLIST_SMTP_SENDER_NAME"))


@dataclass
class SiteSettings:
    homepage: str = field(default=MISSING)
    image_url: str | None = field(default=None)


@dataclass
class EnvironmentSettings:
    redis: RedisSettings = field(default_factory=RedisSettings)
    user: UserSettings = field(default_factory=UserSettings)
    crypto: CryptoSettings = field(default_factory=CryptoSettings)
    email: EmailSettings = field(default_factory=EmailSettings)
    site: SiteSettings = field(default_factory=SiteSettings)
    debug: bool = field(default=False)
