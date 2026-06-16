import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.worker.scraper import extract_dom_context


@pytest.mark.asyncio
async def test_extract_dom_context_success():
    """Test successful DOM extraction with mocked Playwright."""
    mock_content = """
    <html>
      <head>
        <title>Test Page</title>
        <meta property="og:title" content="Test OG Title" />
        <meta property="og:image" content="https://example.com/image.jpg" />
        <meta property="og:description" content="Test description" />
      </head>
      <body>
        <p>First paragraph content here.</p>
        <p>Second paragraph content here.</p>
      </body>
    </html>
    """

    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = (
            mock_browser
        )

        result = await extract_dom_context("https://example.com")

        assert result["success"] is True
        assert result["title"] == "Test OG Title"
        assert result["image_url"] == "https://example.com/image.jpg"
        assert "paragraph" in result["raw_text_sample"].lower()


@pytest.mark.asyncio
async def test_extract_dom_context_failure():
    """Test graceful failure when Playwright throws."""
    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_pw.return_value.__aenter__.side_effect = Exception("Browser crashed")

        result = await extract_dom_context("https://example.com")

        assert result["success"] is False
        assert "error" in result


@pytest.mark.asyncio
async def test_extract_dom_context_no_og_tags():
    """Test extraction when no Open Graph tags are present."""
    mock_content = """
    <html>
      <head><title>Simple Page</title></head>
      <body><p>Some body text.</p></body>
    </html>
    """

    with patch("app.worker.scraper.async_playwright") as mock_pw:
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_page.content.return_value = mock_content
        mock_browser.new_page.return_value = mock_page
        mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = (
            mock_browser
        )

        result = await extract_dom_context("https://example.com")

        assert result["success"] is True
        assert result["title"] == "Simple Page"
        assert result["image_url"] is None
