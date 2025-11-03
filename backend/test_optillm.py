"""
Test OptiLLM techniques with Google Gemini.
Tests each technique individually with the riddle.
"""

import asyncio
import os

from merlin.services.optillm_service import OptiLLMService
from openai import OpenAI

# The riddle to test
RIDDLE = """What word in the English language does the following: the first two letters signify a male, the first three letters signify a female, the first four letters signify a great, while the entire word signifies a great woman. What is the word?"""

# Google Gemini API configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
if not GOOGLE_API_KEY:
    print("ERROR: GOOGLE_API_KEY environment variable not set!")
    print("Set it with: $env:GOOGLE_API_KEY = 'your-key-here'")
    exit(1)

MODEL = "gemini-2.5-flash-lite"  # or "gemini-2.0-flash-exp" if available


async def test_technique(service: OptiLLMService, technique: str):
    """Test a single OptiLLM technique."""
    print(f"\n{'='*80}")
    print(f"🧪 Testing Technique: {technique.upper()}")
    print(f"{'='*80}")

    try:
        result = await service.apply_techniques(
            provider="google",
            model=MODEL,
            messages=[{"role": "user", "content": RIDDLE}],
            api_key=GOOGLE_API_KEY,
            techniques=[technique],
        )

        print(f"\n✅ SUCCESS - {technique}")
        print(f"\n📝 Response (first 500 chars):")
        print("-" * 80)
        print(result[:500])
        if len(result) > 500:
            print(f"\n... (truncated, total length: {len(result)} chars)")
        print("-" * 80)

        return True, result

    except Exception as e:
        print(f"\n❌ FAILED - {technique}")
        print(f"Error: {str(e)}")
        print(f"Error Type: {type(e).__name__}")
        return False, str(e)


async def test_no_techniques(service: OptiLLMService):
    """Test without any techniques (baseline)."""
    print(f"\n{'='*80}")
    print(f"🎯 Testing BASELINE (No Techniques)")
    print(f"{'='*80}")

    try:
        result = await service.apply_techniques(
            provider="google",
            model=MODEL,
            messages=[{"role": "user", "content": RIDDLE}],
            api_key=GOOGLE_API_KEY,
            techniques=[],
        )

        print(f"\n✅ SUCCESS - Baseline")
        print(f"\n📝 Response:")
        print("-" * 80)
        print(result)
        print("-" * 80)

        return True, result

    except Exception as e:
        print(f"\n❌ FAILED - Baseline")
        print(f"Error: {str(e)}")
        return False, str(e)


async def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("🧙 MERLIN OPTILLM TESTING SUITE")
    print("=" * 80)
    print(f"Model: {MODEL}")
    print(f"Provider: Google Gemini")
    print(f"API Key: {'✓ Set' if GOOGLE_API_KEY else '✗ Not Set'}")
    print("=" * 80)

    # Initialize service
    service = OptiLLMService()

    # Get all available techniques
    techniques = list(service.TECHNIQUES.keys())
    print(f"\n📋 Available Techniques ({len(techniques)}):")
    for i, tech in enumerate(techniques, 1):
        print(f"  {i:2d}. {tech}")

    # Test baseline first
    print("\n\n" + "🔹" * 40)
    baseline_success, baseline_result = await test_no_techniques(service)
    await asyncio.sleep(5)  # Rate limiting

    # Test each technique
    results = {}
    for i, technique in enumerate(techniques, 1):
        print(f"\n\n{'🔹'*40}")
        print(f"Progress: {i}/{len(techniques)}")

        success, result = await test_technique(service, technique)
        results[technique] = {"success": success, "result": result}

        # Rate limiting - wait 5 seconds between techniques
        if i < len(techniques):
            print(f"\n⏱️  Waiting 5 seconds for rate limiting...")
            await asyncio.sleep(5)

    # Summary
    print("\n\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)

    successful = [t for t, r in results.items() if r["success"]]
    failed = [t for t, r in results.items() if not r["success"]]

    print(f"\n✅ Successful: {len(successful)}/{len(techniques)}")
    for tech in successful:
        print(f"   • {tech}")

    if failed:
        print(f"\n❌ Failed: {len(failed)}/{len(techniques)}")
        for tech in failed:
            print(f"   • {tech}")
            print(f"     Error: {results[tech]['result'][:100]}...")

    print("\n" + "=" * 80)
    print(f"✨ Testing Complete!")
    print("=" * 80)

    # Return results for further analysis
    return results


if __name__ == "__main__":
    results = asyncio.run(main())
