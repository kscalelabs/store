"""Defines the bot environment settings."""

from dataclasses import dataclass, field

from omegaconf import II, MISSING


@dataclass
class OauthSettings:
    github_client_id: str = field(default=II("oc.env:GITHUB_CLIENT_ID"))
    github_client_secret: str = field(default=II("oc.env:GITHUB_CLIENT_SECRET"))
    google_client_id: str = field(default=II("oc.env:GOOGLE_CLIENT_ID"))
    google_client_secret: str = field(default=II("oc.env:GOOGLE_CLIENT_SECRET"))


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
    host: str = field(default=II("oc.env:SMTP_HOST"))
    port: int = field(default=587)
    username: str = field(default=II("oc.env:SMTP_USERNAME"))
    password: str = field(default=II("oc.env:SMTP_PASSWORD"))
    sender_email: str = field(default=II("oc.env:SMTP_SENDER_EMAIL"))
    sender_name: str = field(default=II("oc.env:SMTP_SENDER_NAME"))


@dataclass
class ImageSettings:
    large_size: tuple[int, int] = field(default=(1536, 1536))
    small_size: tuple[int, int] = field(default=(256, 256))
    max_bytes: int = field(default=1536 * 1536 * 25)
    quality: int = field(default=80)


@dataclass
class S3Settings:
    bucket: str = field(default=II("oc.env:S3_BUCKET"))
    prefix: str = field(default=II("oc.env:S3_PREFIX"))


@dataclass
class DynamoSettings:
    table_name: str = field(default=MISSING)


@dataclass
class SiteSettings:
    homepage: str = field(default=MISSING)
    image_base_url: str = field(default=MISSING)


@dataclass
class EnvironmentSettings:
    oauth: OauthSettings = field(default_factory=OauthSettings)
    user: UserSettings = field(default_factory=UserSettings)
    crypto: CryptoSettings = field(default_factory=CryptoSettings)
    email: EmailSettings = field(default_factory=EmailSettings)
    image: ImageSettings = field(default_factory=ImageSettings)
    s3: S3Settings = field(default_factory=S3Settings)
    dynamo: DynamoSettings = field(default_factory=DynamoSettings)
    site: SiteSettings = field(default_factory=SiteSettings)
    debug: bool = field(default=False)
