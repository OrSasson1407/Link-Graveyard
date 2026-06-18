from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from typing import Optional
import sys


class Settings(BaseSettings):
    # Redis
    redis_url: str = "redis://localhost:6380"

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5439/link_graveyard"

    # OpenAI
    openai_api_key: Optional[str] = None

    # NestJS callback
    nestjs_callback_url: str = "http://api-gateway:3000/api/v1/webhooks/worker-callback"
    internal_worker_secret: str = "changeme-internal-secret"

    # Sentry
    sentry_dsn: Optional[str] = None

    # Playwright
    playwright_timeout: int = 15000
    playwright_headless: bool = True

    # Celery
    celery_broker_url: str = "redis://localhost:6380/0"
    celery_result_backend: str = "redis://localhost:6380/1"

    @field_validator("internal_worker_secret")
    @classmethod
    def secret_must_not_be_default(cls, v: str) -> str:
        import os
        if os.getenv("APP_ENV", "development") == "production" and v == "changeme-internal-secret":
            raise ValueError("internal_worker_secret must be changed in production")
        return v

    @field_validator("database_url")
    @classmethod
    def database_url_must_be_set(cls, v: str) -> str:
        if "user:pass@localhost" in v:
            import os
            if os.getenv("APP_ENV", "development") == "production":
                raise ValueError("database_url must be explicitly set in production")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


try:
    settings = Settings()
except Exception as e:
    print(f"[CONFIG ERROR] Environment validation failed: {e}", file=sys.stderr)
    raise