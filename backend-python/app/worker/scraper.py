import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from typing import Optional
import logging

logger = logging.getLogger(__name__)


async def extract_dom_context(url: str, timeout: int = 15000) -> dict:
    """
    Uses Playwright headless Chromium to extract DOM content.
    Falls back to BeautifulSoup for static sites.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            # Wait until network is idle to capture SPA content
            await page.goto(url, wait_until="networkidle", timeout=timeout)
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")

            # Extract Open Graph meta tags
            og_title = soup.find("meta", property="og:title")
            og_image = soup.find("meta", property="og:image")
            og_description = soup.find("meta", property="og:description")

            # Extract main page title
            page_title = None
            if og_title and og_title.get("content"):
                page_title = og_title["content"]
            elif soup.title and soup.title.string:
                page_title = soup.title.string.strip()

            # Extract image URL
            image_url = None
            if og_image and og_image.get("content"):
                image_url = og_image["content"]

            # Extract description
            description = None
            if og_description and og_description.get("content"):
                description = og_description["content"]

            # Extract main body text for AI summarization (first 10 paragraphs)
            paragraphs = soup.find_all("p")
            body_text = " ".join(
                [p.get_text(strip=True) for p in paragraphs[:10] if p.get_text(strip=True)]
            )

            # Extract meta description as fallback
            if not body_text:
                meta_desc = soup.find("meta", attrs={"name": "description"})
                if meta_desc and meta_desc.get("content"):
                    body_text = meta_desc["content"]

            logger.info(f"DOM extraction complete for {url}")

            return {
                "title": page_title,
                "image_url": image_url,
                "description": description,
                "raw_text_sample": body_text[:3000],  # Cap at 3000 chars for LLM
                "success": True,
            }

        except Exception as e:
            logger.error(f"Playwright extraction failed for {url}: {e}")
            return {
                "title": None,
                "image_url": None,
                "description": None,
                "raw_text_sample": "",
                "success": False,
                "error": str(e),
            }
        finally:
            await browser.close()


def extract_dom_context_sync(url: str, timeout: int = 15000) -> dict:
    """Synchronous wrapper for Celery tasks."""
    return asyncio.run(extract_dom_context(url, timeout))
