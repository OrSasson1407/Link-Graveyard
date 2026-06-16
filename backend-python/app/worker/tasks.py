import os
import httpx
from celery import Celery
from app.worker.scraper import extract_dom_context_sync

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery_app = Celery("tasks", broker=redis_url, backend=redis_url)

NESTJS_CALLBACK_URL = os.getenv("NESTJS_INTERNAL_URL", "http://api-gateway:3000") + "/api/v1/internal/links/processed"
INTERNAL_SECRET = os.getenv("INTERNAL_WORKER_SECRET", "changeme-internal-secret")


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def process_link_task(self, link_id: str, url: str, user_id: str, context_text: str = ""):
    try:
        scrape_result = extract_dom_context_sync(url)

        payload = {
            "link_id": link_id,
            "user_id": user_id,
            "title": scrape_result.get("title"),
            "preview_image": scrape_result.get("image_url"),
            "raw_text_sample": scrape_result.get("raw_text_sample", ""),
            "context_text": context_text,
            "success": scrape_result.get("success", False),
        }

        response = httpx.post(
            NESTJS_CALLBACK_URL,
            json=payload,
            headers={"x-internal-secret": INTERNAL_SECRET},
            timeout=30,
        )
        response.raise_for_status()

    except Exception as exc:
        raise self.retry(exc=exc)
