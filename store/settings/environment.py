"""Defines the bot environment settings."""

from dataclasses import dataclass, field

from omegaconf import MISSING


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
    host: str = field(default=MISSING)
    port: int = field(default=MISSING)
    email: str = field(default=MISSING)
    password: str = field(default=MISSING)
    name: str = field(default=MISSING)


@dataclass
class SiteSettings:
    homepage: str = field(default=MISSING)
    api: str = field(default=MISSING)
    image_url: str | None = field(default=None)


@dataclass
class EnvironmentSettings:
    user: UserSettings = field(default_factory=UserSettings)
    crypto: CryptoSettings = field(default_factory=CryptoSettings)
    email: EmailSettings = field(default_factory=EmailSettings)
    site: SiteSettings = field(default_factory=SiteSettings)
    debug: bool = field(default=False)
