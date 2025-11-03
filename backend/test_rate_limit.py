"""
Quick test script to verify rate limiting works.

Run this after starting the backend to test the 50 requests/hour limit.
"""

import asyncio

import httpx

API_BASE_URL = "http://localhost:8001"


async def test_rate_limit():
    """Send multiple requests to test rate limiting."""

    async with httpx.AsyncClient() as client:
        # First, try to get auth token (you'll need to replace with actual auth)
        print("Testing rate limiting...")
        print("Note: You need to be authenticated to test properly")
        print("Sending 52 requests quickly to trigger rate limit...\n")

        for i in range(52):
            try:
                response = await client.get(
                    f"{API_BASE_URL}/api/v1/chat/models", timeout=5.0
                )

                if response.status_code == 429:
                    print(f"✅ Request {i+1}: Rate limit triggered! (429)")
                    print(f"   Response: {response.text}")
                    break
                elif response.status_code == 401:
                    print(f"⚠️  Request {i+1}: Unauthorized (401) - Need auth token")
                    print("   Cannot test user-based rate limiting without auth")
                    break
                else:
                    print(f"✓ Request {i+1}: Success ({response.status_code})")

            except Exception as e:
                print(f"❌ Request {i+1}: Error - {e}")
                break

            # Small delay to avoid overwhelming the server
            await asyncio.sleep(0.1)


if __name__ == "__main__":
    asyncio.run(test_rate_limit())
