"""Defines the bot environment settings."""

from dataclasses import dataclass, field

from omegaconf import MISSING


@dataclass
class UserSettings:
    admin_emails: list[str] = field(default=MISSING)
    # The field below is used to restrict the development server to only
    # authorized users, to prevent random people from creating accounts.
    authorized_users: list[str] | None = field(default=None)


@dataclass
class SiteSettings:
    homepage: str = field(default=MISSING)


@dataclass
class SQLiteDatabaseSettings:
    host: str = field(default=MISSING)


@dataclass
class PostgreSQLDatabaseSettings:
    read_host: str = field(default=MISSING)
    write_host: str = field(default=MISSING)
    port: int = field(default=MISSING)
    username: str = field(default=MISSING)
    password: str = field(default=MISSING)
    database: str = field(default="postgres")


@dataclass
class DatabaseSettings:
    kind: str = field(default=MISSING)
    generate_schemas: bool = field(default=MISSING)
    sqlite: SQLiteDatabaseSettings = field(default_factory=SQLiteDatabaseSettings)
    postgres: PostgreSQLDatabaseSettings = field(default_factory=PostgreSQLDatabaseSettings)


@dataclass
class WorkerSettings:
    scheme: str = field(default="http")
    host: str = field(default=MISSING)
    port: int | None = field(default=MISSING)
    sampling_timesteps: int | None = field(default=None)
    soft_time_limit: int = field(default=30)
    max_retries: int = field(default=3)


@dataclass
class AudioFileSettings:
    file_ext: str = field(default="flac")
    sample_rate: int = field(default=16000)
    min_sample_rate: int = field(default=8000)
    sample_width: int = field(default=2)
    num_channels: int = field(default=1)
    res_type: str = field(default="kaiser_fast")
    max_mb: int = field(default=10)
    min_duration: float = field(default=5.0)
    max_duration: float = field(default=30.0)


@dataclass
class LocalFileSettings:
    root_dir: str = field(default=MISSING)


@dataclass
class S3FileSettings:
    bucket: str = field(default=MISSING)
    subfolder: str = field(default=MISSING)
    url_expiration: int = field(default=3600)


@dataclass
class FileSettings:
    fs_type: str = field(default=MISSING)
    audio: AudioFileSettings = field(default_factory=AudioFileSettings)
    local: LocalFileSettings = field(default_factory=LocalFileSettings)
    s3: S3FileSettings = field(default_factory=S3FileSettings)


@dataclass
class EmailSettings:
    host: str = field(default=MISSING)
    port: int = field(default=MISSING)
    name: str = field(default=MISSING)
    email: str = field(default=MISSING)
    password: str = field(default=MISSING)


@dataclass
class CryptoSettings:
    jwt_secret: str = field(default=MISSING)
    expire_token_minutes: int = field(default=30)
    expire_otp_minutes: int = field(default=5)
    algorithm: str = field(default="HS256")
    google_client_id: str = field(default=MISSING)


@dataclass
class ModelSettings:
    hf_hub_token: str | None = field(default=None)
    cache_dir: str | None = field(default=None)
    key: str = field(default=MISSING)


@dataclass
class EnvironmentSettings:
    app_name: str = field(default="bot")
    environment: str = field(default=MISSING)
    user: UserSettings = field(default_factory=UserSettings)
    site: SiteSettings = field(default_factory=SiteSettings)
    database: DatabaseSettings = field(default_factory=DatabaseSettings)
    worker: WorkerSettings = field(default_factory=WorkerSettings)
    file: FileSettings = field(default_factory=FileSettings)
    email: EmailSettings = field(default_factory=EmailSettings)
    crypto: CryptoSettings = field(default_factory=CryptoSettings)
    model: ModelSettings = field(default_factory=ModelSettings)
    debug: bool = field(default=False)
