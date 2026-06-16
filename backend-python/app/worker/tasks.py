import logging
import httpx
from celery import Celery
from openai import OpenAI
from app.core.config import settings
from app.worker.scraper import extract_dom_context_sync

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "link_graveyard_worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
)

# OpenAI client
openai_client = OpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = '''You are the intelligence engine for "Link Graveyard".
Analyze the following web page content and user context.
URL: {url}
USER_CONTEXT_NOTE: {context_text}
WEBSITE_TEXT_SAMPLE: {raw_text_sample}

Output strictly valid JSON with the following schema:
{
  "category": "ARTICLE" | "VIDEO" | "PRODUCT" | "DEV",
  "intent": "TO_READ" | "TO_BUY" | "CODE_REVIEW" | "GENERAL",
  "summary": "A concise 2-3 sentence summary of the content.",
  "dynamic_tags": ["tag1", "tag2"]
}'''


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=5,
    name="tasks.process_link",
)
def process_link_task(self, link_id: str, url: str, user_id: str, context_text: str = ""):
    """
    Main Celery task: scrape DOM, run AI analysis, callback to NestJS.
    """
    logger.info(f"Processing link task: linkId={link_id}, url={url}")

    try:
        # Step 1: DOM Scraping via Playwright
        scraped = extract_dom_context_sync(url, timeout=settings.playwright_timeout)

        if not scraped["success"]:
            logger.warning(f"Scraping failed for {url}, proceeding with empty content")

        # Step 2: AI Analysis via OpenAI
        prompt = SYSTEM_PROMPT.format(
            url=url,
            context_text=context_text or "No context provided",
            raw_text_sample=scraped.get("raw_text_sample", "")[:3000],
        )

        ai_result = {
            "category": "ARTICLE",
            "intent": "GENERAL",
            "summary": "Could not generate summary.",
            "dynamic_tags": [],
        }

        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Analyze this link: {url}"},
                ],
                response_format={"type": "json_object"},
                max_tokens=500,
            )
            import json
            ai_result = json.loads(response.choices[0].message.content)
        except Exception as ai_err:
            logger.error(f"AI analysis failed for {link_id}: {ai_err}")

        # Step 3: Callback to NestJS API Gateway
        callback_payload = {
            "linkId": link_id,
            "title": scraped.get("title"),
            "aiSummary": ai_result.get("summary"),
            "previewImage": scraped.get("image_url"),
            "dynamicData": {
                "tags": ai_result.get("dynamic_tags", []),
                "description": scraped.get("description"),
            },
            "category": ai_result.get("category"),
            "inferredAction": ai_result.get("intent"),
        }

        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                settings.nestjs_callback_url,
                json=callback_payload,
                headers={"x-internal-secret": settings.internal_worker_secret},
            )
            resp.raise_for_status()

        logger.info(f"Successfully processed and called back for linkId={link_id}")
        return {"success": True, "linkId": link_id}

    except Exception as exc:
        logger.error(f"Task failed for linkId={link_id}: {exc}")
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 5)
