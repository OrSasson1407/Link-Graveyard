import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

WORDS_PER_MINUTE = 200


def estimate_reading_time(text: str) -> int:
    """Returns estimated reading time in minutes (minimum 1)."""
    word_count = len(text.split())
    return max(1, round(word_count / WORDS_PER_MINUTE))


async def extract_dom_context(url: str, timeout: int = 15000) -> dict:
    """
    Uses Playwright headless Chromium to extract DOM content.
    Falls back to BeautifulSoup for static sites.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=timeout)
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")

            og_title       = soup.find("meta", property="og:title")
            og_image       = soup.find("meta", property="og:image")
            og_description = soup.find("meta", property="og:description")

            page_title = None
            if og_title and og_title.get("content"):
                page_title = og_title["content"]
            elif soup.title and soup.title.string:
                page_title = soup.title.string.strip()

            image_url = og_image["content"] if og_image and og_image.get("content") else None
            description = og_description["content"] if og_description and og_description.get("content") else None

            paragraphs = soup.find_all("p")
            body_text = " ".join(
                [p.get_text(strip=True) for p in paragraphs[:10] if p.get_text(strip=True)]
            )

            if not body_text:
                meta_desc = soup.find("meta", attrs={"name": "description"})
                if meta_desc and meta_desc.get("content"):
                    body_text = meta_desc["content"]

            # Full text for reading time (up to 50 paragraphs)
            full_text = " ".join(
                [p.get_text(strip=True) for p in paragraphs[:50] if p.get_text(strip=True)]
            )
            reading_time_minutes = estimate_reading_time(full_text) if full_text else None

            logger.info(f"DOM extraction complete for {url} | reading_time={reading_time_minutes}min")

            return {
                "title": page_title,
                "image_url": image_url,
                "description": description,
                "raw_text_sample": body_text[:3000],
                "reading_time_minutes": reading_time_minutes,
                "success": True,
            }

        except Exception as e:
            logger.error(f"Playwright extraction failed for {url}: {e}")
            return {
                "title": None,
                "image_url": None,
                "description": None,
                "raw_text_sample": "",
                "reading_time_minutes": None,
                "success": False,
                "error": str(e),
            }
        finally:
            await browser.close()


def extract_dom_context_sync(url: str, timeout: int = 15000) -> dict:
    """Synchronous wrapper for Celery tasks."""
    return asyncio.run(extract_dom_context(url, timeout))