from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "PetNeighbor API"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    use_mock_data: bool = True
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ]
    )
    postgres_dsn: str = "postgresql+asyncpg://petneighbor:petneighbor@localhost:5432/petneighbor"
    redis_url: str = "redis://localhost:6379/0"
    amap_web_key: str = ""
    jwt_secret: str = "<SECRET>"


@lru_cache
def get_settings() -> Settings:
    return Settings()
