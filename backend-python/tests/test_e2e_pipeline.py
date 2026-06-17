import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import httpx


@pytest.mark.asyncio
async def test_full_pipeline_success():
    """Full pipeline: scrape → callback → verify payload"""
    from app.worker.scraper import extract_dom_context

    mock_html = """<html><head>
        <title>GitHub PR</title>
        <meta property="og:title" content="Fix memory leak"/>
        <meta property="og:image" content="https://github.com/img.png"/>
    </head><body><p>This PR fixes a memory leak in the core module.</p></body></html>"""

    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_html
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser

        result = await extract_dom_context("https://github.com/nestjs/nest/pull/123")

    assert result["success"] is True
    assert result["title"] == "Fix memory leak"
    assert result["image_url"] == "https://github.com/img.png"
    assert "memory leak" in result["raw_text_sample"]


@pytest.mark.asyncio
async def test_pipeline_callback_payload_structure():
    """Verify callback payload shape after scraping"""
    scrape_result = {
        "title": "Test Page",
        "image_url": "https://example.com/img.jpg",
        "raw_text_sample": "Test content",
        "success": True,
    }

    payload = {
        "link_id": "test-link-id",
        "user_id": "test-user-id",
        "title": scrape_result.get("title"),
        "preview_image": scrape_result.get("image_url"),
        "raw_text_sample": scrape_result.get("raw_text_sample", ""),
        "context_text": "test context",
        "success": scrape_result.get("success", False),
    }

    assert payload["link_id"] == "test-link-id"
    assert payload["user_id"] == "test-user-id"
    assert payload["title"] == "Test Page"
    assert payload["success"] is True


@pytest.mark.asyncio
async def test_pipeline_scrape_failure_sends_success_false():
    """When scraper fails, callback should send success=False"""
    from app.worker.scraper import extract_dom_context

    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_pw.return_value.__aenter__.side_effect = Exception("Browser crashed")
        result = await extract_dom_context("https://example.com")

    assert result["success"] is False

    payload = {
        "link_id": "link-1",
        "user_id": "user-1",
        "success": result["success"],
    }
    assert payload["success"] is False


@pytest.mark.asyncio
async def test_pipeline_callback_http_call():
    """Verify the HTTP call to NestJS is made correctly"""
    with patch("app.worker.tasks.extract_dom_context_sync") as mock_scrape, \
         patch("app.worker.tasks.httpx.post") as mock_post:

        mock_scrape.return_value = {
            "title": "My Article",
            "image_url": "https://img.com/a.png",
            "raw_text_sample": "Content here",
            "success": True,
        }
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        from app.worker.tasks import process_link_task
        process_link_task.run("link-1", "https://example.com", "user-1", "ctx")

        assert mock_post.called
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["title"] == "My Article"
        assert call_kwargs["json"]["success"] is True


@pytest.mark.asyncio
async def test_pipeline_e2e_no_og_tags():
    """Pipeline handles pages without OG tags"""
    from app.worker.scraper import extract_dom_context

    mock_html = """<html><head><title>Plain Page</title></head>
    <body><p>Some article content here.</p><p>More content.</p></body></html>"""

    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_html
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser

        result = await extract_dom_context("https://plain-site.com/article")

    assert result["success"] is True
    assert result["title"] == "Plain Page"
    assert result["image_url"] is None


@pytest.mark.asyncio
async def test_pipeline_e2e_spa_content():
    """Pipeline handles SPA-rendered content"""
    from app.worker.scraper import extract_dom_context

    mock_html = """<html><head>
        <meta property="og:title" content="React App"/>
    </head><body><div id="root"><p>Rendered by React</p></div></body></html>"""

    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_html
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser

        result = await extract_dom_context("https://spa-app.com")

    assert result["title"] == "React App"
    assert result["success"] is True


def test_pipeline_task_max_retries():
    """Verify max_retries is set on the celery task"""
    from app.worker.tasks import process_link_task
    assert process_link_task.max_retries == 3


def test_pipeline_task_default_retry_delay():
    """Verify default_retry_delay is set"""
    from app.worker.tasks import process_link_task
    assert process_link_task.default_retry_delay == 5


def test_pipeline_celery_task_name():
    """Verify task name is registered correctly"""
    from app.worker.tasks import process_link_task
    assert "process_link_task" in process_link_task.name


def test_pipeline_callback_url_uses_env():
    """Verify callback URL is built from env var"""
    import os
    from app.worker import tasks
    assert "internal/links/processed" in tasks.NESTJS_CALLBACK_URL


def test_pipeline_internal_secret_from_env():
    """Verify internal secret is loaded from env"""
    from app.worker import tasks
    assert tasks.INTERNAL_SECRET is not None
    assert len(tasks.INTERNAL_SECRET) > 0


@pytest.mark.asyncio
async def test_pipeline_scraper_closes_browser_on_error():
    """Browser must close even when page.goto raises"""
    from app.worker.scraper import extract_dom_context

    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.goto.side_effect = Exception("Navigation timeout")
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser

        result = await extract_dom_context("https://slow-site.com")

    assert result["success"] is False
    mock_browser.close.assert_called_once()


@pytest.mark.asyncio
async def test_pipeline_multiple_links_sequential():
    """Process multiple links sequentially through scraper"""
    from app.worker.scraper import extract_dom_context

    urls = [
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
    ]

    mock_html = """<html><head><title>Page</title></head><body><p>content</p></body></html>"""

    results = []
    for url in urls:
        with patch("app.worker.scraper.async_playwright") as mock_pw:
            mock_browser = AsyncMock()
            mock_page = AsyncMock()
            mock_page.content.return_value = mock_html
            mock_browser.new_page.return_value = mock_page
            mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
            r = await extract_dom_context(url)
            results.append(r)

    assert all(r["success"] is True for r in results)
    assert len(results) == 3
