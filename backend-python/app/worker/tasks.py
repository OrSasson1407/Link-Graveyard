import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery_app = Celery("tasks", broker=redis_url, backend=redis_url)

@celery_app.task
def process_link_task(link_id: str):
    pass
