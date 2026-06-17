import logging
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional
from app.core.config import settings
from celery.result import AsyncResult
from celery.result import AsyncResult
from celery.result import AsyncResult
from app.worker.tasks import process_link_task
from app.worker.scraper import extract_dom_context

logger = logging.getLogger(__name__)
router = APIRouter()


class ScrapeRequest(BaseModel):
    link_id: str
    url: str
    user_id: str
    context_text: Optional[str] = None


class ScrapeResponse(BaseModel):
    success: bool
    task_id: Optional[str] = None
    message: str


def verify_internal_secret(x_internal_secret: str = Header(...)):
    if x_internal_secret != settings.internal_worker_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")
    return x_internal_secret


@router.post(
    "/scrape",
    response_model=ScrapeResponse,
    dependencies=[Depends(verify_internal_secret)],
)
async def trigger_scrape(body: ScrapeRequest):
    """
    Enqueue a link processing task via Celery.
    Called internally by the NestJS API Gateway.
    """
    logger.info(f"Enqueueing scrape task for linkId={body.link_id}")

    try:
        task = process_link_task.delay(
            link_id=body.link_id,
            url=str(body.url),
            user_id=body.user_id,
            context_text=body.context_text or "",
        )
        return ScrapeResponse(
            success=True,
            task_id=task.id,
            message=f"Task enqueued: {task.id}",
        )
    except Exception as e:
        logger.error(f"Failed to enqueue task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/scrape/status/{task_id}",
    dependencies=[Depends(verify_internal_secret)],
)
async def get_task_status(task_id: str):
    """Check the status of a Celery scraping task."""
    from celery.result import AsyncResult
    from app.worker.tasks import celery_app

    result = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }


@router.post(
    "/scrape/sync",
    dependencies=[Depends(verify_internal_secret)],
)
async def scrape_sync(body: ScrapeRequest):
    """
    Synchronous scrape endpoint for testing/debugging.
    Not for production use under load.
    """
    logger.info(f"Synchronous scrape for url={body.url}")
    result = await extract_dom_context(str(body.url))
    return result


