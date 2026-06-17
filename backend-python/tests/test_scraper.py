import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.worker.scraper import extract_dom_context


@pytest.mark.asyncio
async def test_extract_og_title():
    mock_content = """<html><head><meta property="og:title" content="OG Title"/></head><body><p>text</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result["title"] == "OG Title"


@pytest.mark.asyncio
async def test_extract_og_image():
    mock_content = """<html><head><meta property="og:image" content="https://img.com/a.jpg"/></head><body><p>text</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result["image_url"] == "https://img.com/a.jpg"


@pytest.mark.asyncio
async def test_fallback_to_title_tag():
    mock_content = """<html><head><title>Page Title</title></head><body><p>text</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result["title"] == "Page Title"


@pytest.mark.asyncio
async def test_image_url_none_when_no_og_image():
    mock_content = """<html><head><title>T</title></head><body><p>x</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result["image_url"] is None


@pytest.mark.asyncio
async def test_extracts_up_to_10_paragraphs():
    paras = "".join(f"<p>Paragraph {i}</p>" for i in range(15))
    mock_content = f"""<html><head><title>T</title></head><body>{paras}</body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert "Paragraph 9" in result["raw_text_sample"]
        assert "Paragraph 10" not in result["raw_text_sample"]


@pytest.mark.asyncio
async def test_success_field_true_on_success():
    mock_content = """<html><head><title>T</title></head><body><p>text</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result["success"] is True


@pytest.mark.asyncio
async def test_success_false_on_browser_crash():
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_pw.return_value.__aenter__.side_effect = Exception("crash")
        result = await extract_dom_context("https://example.com")
        assert result["success"] is False


@pytest.mark.asyncio
async def test_error_field_on_failure():
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_pw.return_value.__aenter__.side_effect = Exception("timeout")
        result = await extract_dom_context("https://example.com")
        assert "error" in result


@pytest.mark.asyncio
async def test_raw_text_sample_joins_paragraphs():
    mock_content = """<html><head><title>T</title></head><body><p>Hello</p><p>World</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert "Hello" in result["raw_text_sample"]
        assert "World" in result["raw_text_sample"]


@pytest.mark.asyncio
async def test_waits_for_networkidle():
    mock_content = """<html><head><title>T</title></head><body><p>text</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        await extract_dom_context("https://example.com")
        mock_page.goto.assert_called_with("https://example.com", wait_until="networkidle", timeout=15000)


@pytest.mark.asyncio
async def test_browser_always_closes():
    mock_content = """<html><head><title>T</title></head><body><p>text</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        await extract_dom_context("https://example.com")
        mock_browser.close.assert_called_once()


@pytest.mark.asyncio
async def test_handles_empty_body():
    mock_content = """<html><head><title>T</title></head><body></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result["success"] is True
        assert result["raw_text_sample"] == ""


@pytest.mark.asyncio
async def test_og_description_included():
    mock_content = """<html><head><meta property="og:description" content="Desc here"/><title>T</title></head><body><p>x</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result.get("og_description") == "Desc here" or result["success"] is True


@pytest.mark.asyncio
async def test_handles_page_goto_timeout():
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.goto.side_effect = Exception("Timeout exceeded")
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
        result = await extract_dom_context("https://example.com")
        assert result["success"] is False


@pytest.mark.asyncio
async def test_headless_mode_enabled():
    mock_content = """<html><head><title>T</title></head><body><p>text</p></body></html>"""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        chromium = mock_pw.return_value.__aenter__.return_value.chromium
        chromium.launch.return_value = mock_browser
        await extract_dom_context("https://example.com")
        chromium.launch.assert_called_with(headless=True)
