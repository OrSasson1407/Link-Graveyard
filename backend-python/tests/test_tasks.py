import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import httpx


def make_task_args():
    return ("link-abc", "https://example.com", "user-xyz", "context text")


def test_process_link_task_calls_scraper():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": None, "raw_text_sample": "text", "success": True}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task
        process_link_task.run(*make_task_args())
        mock_scrape.assert_called_once()


def test_process_link_task_posts_to_nestjs():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": None, "raw_text_sample": "s", "success": True}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task, NESTJS_CALLBACK_URL
        process_link_task.run(*make_task_args())
        mock_post.assert_called_once_with(
            NESTJS_CALLBACK_URL, json=pytest.approx({"link_id": "link-abc", "user_id": "user-xyz",
            "title": "T", "preview_image": None, "raw_text_sample": "s",
            "context_text": "context text", "success": True}, rel=1e-3),
            headers=pytest.approx({"x-internal-secret": mock_post.call_args.kwargs["headers"]["x-internal-secret"]}, rel=1e-3),
            timeout=30,
        )


def test_process_link_task_sends_internal_secret():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": None, "raw_text_sample": "", "success": True}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task, INTERNAL_SECRET
        process_link_task.run(*make_task_args())
        headers = mock_post.call_args.kwargs["headers"]
        assert headers["x-internal-secret"] == INTERNAL_SECRET


def test_process_link_task_retries_on_scrape_error():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape:
        mock_scrape.side_effect = Exception("scrape failed")
        from app.worker.tasks import process_link_task
        task_instance = MagicMock()
        task_instance.retry = MagicMock(side_effect=Exception("retry"))
        with pytest.raises(Exception):
            process_link_task.run(*make_task_args())


def test_process_link_task_retries_on_callback_error():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": None, "raw_text_sample": "", "success": True}
        mock_post.return_value.raise_for_status = MagicMock(side_effect=httpx.HTTPStatusError("err", request=MagicMock(), response=MagicMock()))
        from app.worker.tasks import process_link_task
        with pytest.raises(Exception):
            process_link_task.run(*make_task_args())


def test_process_link_task_sends_success_false_on_scrape_failure():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": None, "image_url": None, "raw_text_sample": "", "success": False}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task
        process_link_task.run(*make_task_args())
        payload = mock_post.call_args.kwargs["json"]
        assert payload["success"] is False


def test_process_link_task_passes_link_id():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": None, "raw_text_sample": "", "success": True}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task
        process_link_task.run(*make_task_args())
        payload = mock_post.call_args.kwargs["json"]
        assert payload["link_id"] == "link-abc"


def test_process_link_task_passes_user_id():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": None, "raw_text_sample": "", "success": True}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task
        process_link_task.run(*make_task_args())
        payload = mock_post.call_args.kwargs["json"]
        assert payload["user_id"] == "user-xyz"


def test_process_link_task_30s_timeout():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": None, "raw_text_sample": "", "success": True}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task
        process_link_task.run(*make_task_args())
        assert mock_post.call_args.kwargs["timeout"] == 30


def test_process_link_task_passes_image_url():
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:
        mock_scrape.return_value = {"title": "T", "image_url": "https://img.com/x.jpg", "raw_text_sample": "", "success": True}
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()
        from app.worker.tasks import process_link_task
        process_link_task.run(*make_task_args())
        payload = mock_post.call_args.kwargs["json"]
        assert payload["preview_image"] == "https://img.com/x.jpg"
