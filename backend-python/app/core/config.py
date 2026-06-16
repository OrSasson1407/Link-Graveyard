from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Redis
    redis_url: str = "redis://localhost:6380"

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5439/link_graveyard"

    # OpenAI
    openai_api_key: Optional[str] = None

    # NestJS callback
    nestjs_callback_url: str = "http://api-gateway:3000/api/v1/webhooks/worker/callback"
    internal_worker_secret: str = "changeme-internal-secret"

    # Sentry
    sentry_dsn: Optional[str] = None

    # Playwright
    playwright_timeout: int = 15000
    playwright_headless: bool = True

    # Celery
    celery_broker_url: str = "redis://localhost:6380/0"
    celery_result_backend: str = "redis://localhost:6380/1"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
