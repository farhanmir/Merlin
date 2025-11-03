"""External API service for third-party integrations (GPTZero, Undetectable AI Pro, etc.)."""

import asyncio
from typing import Optional

import httpx
from merlin.core.config import get_settings

# Optional: Playwright for web automation (install with: pip install playwright)
try:
    from playwright.async_api import async_playwright

    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class ExternalAPIService:
    """Service for calling external AI detection and humanization APIs."""

    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.timeout = httpx.Timeout(
            120.0, read=300.0
        )  # Long timeout for API processing

    async def gptzero_detect(self, text: str, api_key: Optional[str] = None) -> dict:
        """
        Detect AI-generated content using GPTZero API.

        Args:
            text: Text to analyze
            api_key: GPTZero API key (optional, uses env var if not provided)

        Returns:
            dict with detection results

        API Docs: https://gptzero.me/docs/api-reference
        """
        key = api_key or self.settings.gptzero_api_key

        if not key:
            return {
                "error": "GPTZero API key not configured",
                "setup_instructions": "Add GPTZERO_API_KEY to your .env file or backend settings",
            }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    "https://api.gptzero.me/v2/predict/text",
                    headers={
                        "X-API-Key": key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "document": text,
                        "version": "2024-01-09",
                    },
                )

                response.raise_for_status()
                data = response.json()

                # Extract key metrics
                return {
                    "success": True,
                    "ai_probability": data.get("documents", [{}])[0].get(
                        "completely_generated_prob", 0
                    ),
                    "overall_class": data.get("documents", [{}])[0].get(
                        "class", "unknown"
                    ),
                    "average_generated_prob": data.get("documents", [{}])[0].get(
                        "average_generated_prob", 0
                    ),
                    "sentence_count": data.get("documents", [{}])[0].get(
                        "sentence_count", 0
                    ),
                    "details": data,
                }

            except httpx.HTTPStatusError as e:
                return {
                    "error": f"GPTZero API error: {e.response.status_code}",
                    "details": e.response.text,
                }
            except Exception as e:
                return {
                    "error": f"GPTZero request failed: {str(e)}",
                }

    async def undetectable_ai_humanize(
        self, text: str, _api_key: Optional[str] = None
    ) -> dict:
        """
        Humanize AI-generated content using undetectableai.pro (free web tool).

        This uses browser automation to interact with the free web interface.
        Requires: pip install playwright && playwright install chromium

        Args:
            text: Text to humanize (max ~1000 words for free tier)
            _api_key: Not used (kept for interface compatibility)

        Returns:
            dict with humanized text

        Website: https://undetectableai.pro
        """
        if not PLAYWRIGHT_AVAILABLE:
            return {
                "error": "Playwright not installed",
                "setup_instructions": "Install with: pip install playwright && playwright install chromium",
            }

        try:
            async with async_playwright() as p:
                # Launch browser in headless mode
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                # Navigate to undetectableai.pro
                await page.goto("https://undetectableai.pro", wait_until="networkidle")

                # Find and fill the textarea with the text to humanize
                await page.fill("textarea", text)

                # Click the "Humanize" button
                await page.click("button:has-text('Humanize')")

                # Wait for the result to appear (max 60 seconds)
                # The humanized text appears in a result container
                try:
                    # Wait for processing to complete
                    await page.wait_for_selector(
                        "text=Humanized successfully", timeout=60000
                    )

                    # Extract the humanized text from the output textarea/div
                    humanized_text = await page.evaluate(
                        """() => {
                        // Try to find the output textarea or div
                        const outputArea = document.querySelector('textarea[readonly]') || 
                                          document.querySelector('.output-text') ||
                                          document.querySelector('[data-output]');
                        return outputArea ? outputArea.value || outputArea.textContent : null;
                    }"""
                    )

                    await browser.close()

                    if humanized_text:
                        return {
                            "success": True,
                            "humanized_text": humanized_text.strip(),
                            "original_text": text,
                            "word_count": len(humanized_text.split()),
                        }
                    else:
                        return {
                            "error": "Could not extract humanized text from page",
                            "details": "The page structure may have changed",
                        }

                except asyncio.TimeoutError:
                    await browser.close()
                    return {
                        "error": "Humanization timed out after 60 seconds",
                        "details": "The free service may be experiencing high load",
                    }

        except Exception as e:
            return {
                "error": f"Undetectable AI Pro automation failed: {str(e)}",
                "details": "Check that Playwright is installed: playwright install chromium",
            }

    def check_api_health(self) -> dict:
        """Check if external APIs are configured and accessible."""
        return {
            "gptzero": {
                "configured": bool(self.settings.gptzero_api_key),
                "type": "api_key",
                "endpoint": "https://api.gptzero.me/v2",
            },
            "undetectable_ai_pro": {
                "configured": PLAYWRIGHT_AVAILABLE,
                "type": "browser_automation",
                "endpoint": "https://undetectableai.pro",
                "free": True,
                "playwright_installed": PLAYWRIGHT_AVAILABLE,
            },
            "status": (
                "ready"
                if self.settings.gptzero_api_key and PLAYWRIGHT_AVAILABLE
                else "partial"
            ),
        }
