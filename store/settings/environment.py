"""Defines the bot environment settings."""

from dataclasses import dataclass, field

from omegaconf import II, MISSING


@dataclass
class OauthSettings:
    github_client_id: str = field(default=II("oc.env:GITHUB_CLIENT_ID"))
    github_client_secret: str = field(default=II("oc.env:GITHUB_CLIENT_SECRET"))


@dataclass
class CryptoSettings:
    cache_token_db_result_seconds: int = field(default=30)
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
    oauth: OauthSettings = field(default_factory=OauthSettings)
    user: UserSettings = field(default_factory=UserSettings)
    crypto: CryptoSettings = field(default_factory=CryptoSettings)
    email: EmailSettings = field(default_factory=EmailSettings)
    site: SiteSettings = field(default_factory=SiteSettings)
    debug: bool = field(default=False)
