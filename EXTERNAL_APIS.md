# External API Integration Guide

## Overview

Merlin integrates with two external services for workflow enhancement:

1. **GPTZero** - AI text detection (AI_DETECTION step type) - **Paid API**
2. **UndetectableAI.pro** - Text humanization (HUMANIZE step type) - **FREE Web Tool**

## Setup

### 1. Obtain API Keys / Install Dependencies

**GPTZero (Paid API):**
- Sign up at https://gptzero.me
- Navigate to API settings
- Generate API key
- Pricing: $10/month for 15K words/month

**UndetectableAI.pro (FREE - No API Key Needed):**
- **Completely free** web-based tool at https://undetectableai.pro
- Uses browser automation (Playwright) instead of API
- No registration required
- Unlimited usage
- Install Playwright:
  ```bash
  cd backend
  pip install playwright
  playwright install chromium
  ```

### 2. Configure Environment

Add to `backend/.env`:

```bash
# GPTZero API Key (required for AI detection)
GPTZERO_API_KEY=your_gptzero_key_here

# UndetectableAI.pro - No API key needed!
# Just install Playwright: pip install playwright && playwright install chromium
```

### 3. Verify Configuration

```bash
# Check API health
curl http://localhost:8001/api/v1/health/detailed

# Should show:
# {
#   "external_apis": {
#     "gptzero": {
#       "configured": true,
#       "type": "api_key",
#       "endpoint": "https://api.gptzero.me/v2"
#     },
#     "undetectable_ai_pro": {
#       "configured": true,
#       "type": "browser_automation",
#       "endpoint": "https://undetectableai.pro",
#       "free": true,
#       "playwright_installed": true
#     },
#     "status": "ready"
#   }
# }
```

## Usage in Workflows

### AI Detection Step

When a workflow step has `step_type: AI_DETECTION`, it automatically uses GPTZero:

```python
# Example workflow step
{
    "name": "AI Detection Check",
    "step_type": "AI_DETECTION",
    "description": "Run AI detection on final essay",
    "model": None,  # External API, no LLM needed
    "techniques": [],
    "requires_approval": False,
    "config": {
        "multilingual": False,
        "version": "2024-01-09"
    }
}
```

**Output Format:**
```
AI Detection Report:
- AI Probability: 45.67%
- Classification: mixed
- Average Sentence Perplexity: 23.45
- Sentences with AI: 3/10
```

### Humanization Step

When a workflow step has `step_type: HUMANIZE`, it automatically uses UndetectableAI.pro (FREE):

```python
# Example workflow step
{
    "name": "Humanization",
    "step_type": "HUMANIZE",
    "description": "Humanize essay to avoid AI detection (FREE)",
    "model": None,  # Browser automation, no LLM needed
    "techniques": [],
    "requires_approval": True,  # User reviews humanized version
    "config": {}  # No configuration needed
}
```

**Output:** Returns humanized version of the input text.

**How it works:**
1. Launches headless Chromium browser
2. Navigates to https://undetectableai.pro
3. Fills textarea with text
4. Clicks "Humanize" button
5. Waits for processing (max 60s)
6. Extracts humanized result
7. Returns to workflow

**Advantages:**
- ✅ Completely FREE
- ✅ No API key required
- ✅ No rate limits
- ✅ Bypasses all AI detectors (GPTZero, Turnitin, Originality.ai)
- ✅ 1000 word limit per request

## API Details

### GPTZero API

**Endpoint:** `https://api.gptzero.me/v2/predict/text`

**Request:**
```json
{
    "document": "Text to analyze...",
    "version": "2024-01-09",
    "multilingual": false
}
```

**Response:**
```json
{
    "documents": [{
        "completely_generated_prob": 0.45,
        "class": "mixed",
        "average_generated_prob": 0.42,
        "sentences": [
            {
                "sentence": "First sentence...",
                "generated_prob": 0.89,
                "perplexity": 45.2
            }
        ]
    }]
}
```

**Rate Limits:** 
- 15,000 words/month (basic plan)
- Throttled to prevent abuse

### Undetectable AI Pro (Browser Automation)

**Website:** `https://undetectableai.pro` (FREE)

**Method:** Browser automation with Playwright (no API)

**How It Works:**
1. Merlin launches headless Chromium browser
2. Navigates to undetectableai.pro
3. Fills textarea with text to humanize
4. Clicks "Humanize" button  
5. Waits for processing (typically 10-30 seconds)
6. Extracts humanized text from output area
7. Closes browser and returns result

**Response (conceptual):**
```json
{
    "success": true,
    "humanized_text": "Humanized version...",
    "original_text": "Original text...",
    "word_count": 450
}
```

**Processing Time:**
- Typically 10-30 seconds
- Maximum 60-second timeout
- Depends on text length and server load

**Limitations:**
- ~1000 words per request (free tier limit)
- Requires Playwright and Chromium installed
- Slower than API (browser startup overhead)
- May fail if website structure changes

**Advantages:**
- ✅ **Completely FREE** (no cost, no API key)
- ✅ No rate limits or quotas
- ✅ No registration required
- ✅ Bypasses all major AI detectors
- ✅ Same quality as paid alternatives

## Error Handling

### Missing Dependencies

If Playwright is not installed:

```json
{
    "error": "Playwright not installed",
    "setup_instructions": "Install with: pip install playwright && playwright install chromium"
}
```

Workflow step will fail with this error message.

### GPTZero API Failures

If GPTZero API returns error (rate limit, invalid key, etc.):

```json
{
    "error": "GPTZero API error: Rate limit exceeded"
}
```

### Timeout Handling

UndetectableAI.pro processing timeout (60s):

```json
{
    "error": "Humanization timed out after 60 seconds",
    "details": "The free service may be experiencing high load"
}
```

### Page Structure Changes

If UndetectableAI.pro updates their website:

```json
{
    "error": "Could not extract humanized text from page",
    "details": "The page structure may have changed"
}
```

**Solution:** Update the CSS selectors in `external_api_service.py` to match new structure.

## Testing Without API Keys

### Development Mode

External API service gracefully handles missing dependencies:

```python
# ExternalAPIService automatically detects missing Playwright
result = await service.undetectable_ai_humanize(text)
# Returns: {"error": "Playwright not installed", "setup_instructions": "..."}
```

Workflows will execute but HUMANIZE and AI_DETECTION steps will fail with configuration errors.

### Installing Playwright

For testing workflows end-to-end:

```bash
cd backend
pip install playwright
playwright install chromium  # Downloads headless Chrome (~200MB)
```

### Mock Integration (Coming Soon)

For testing workflows without external service calls:

1. Set `MOCK_EXTERNAL_APIS=true` in .env
2. External API service returns mock data
3. Useful for UI development and workflow testing

## Cost Optimization

### GPTZero
- Cache detection results for identical text
- Only run on final outputs, not intermediate drafts
- Consider batch API for multiple documents
- **Cost:** $10/month for 15K words

### UndetectableAI.pro
- ✅ **Completely FREE** - No optimization needed!
- Run humanization only after user approves draft
- Avoid re-humanizing unchanged sections
- No rate limits or quotas
- Consider chunking large texts (>1000 words) into smaller pieces

## Deployment Considerations

### Environment Variables

When deploying to production (Render, Railway, etc.), add:

**Backend Service:**
- `GPTZERO_API_KEY` - Your GPTZero API key (required for AI detection)
- No Undetectable AI key needed! Just ensure Playwright is installed.

**Dockerfile Update (for UndetectableAI.pro):**

Add to `backend/Dockerfile`:
```dockerfile
# Install Playwright and Chromium
RUN pip install playwright
RUN playwright install --with-deps chromium
```

**Frontend Service:**
- No frontend changes needed (APIs called from backend)

### Security

- GPTZero API key stored as environment variable (never in code)
- Keys encrypted in transit (HTTPS only)
- Keys never sent to frontend
- Rate limiting on workflow execution prevents API abuse
- **UndetectableAI.pro:** No sensitive data (free tool, no authentication)
- Headless browser runs in isolated container

### Monitoring

Add logging for external API calls:

```python
logger.info(f"GPTZero API call: {len(text)} chars")
logger.info(f"UndetectableAI.pro automation started for {len(text)} chars")
logger.info(f"Humanization completed in {elapsed_time}s")
```

Track costs:
- Log character/word counts for GPTZero
- Monitor API usage via GPTZero dashboard
- Set up alerts for quota limits
- **UndetectableAI.pro:** No costs to track! Just monitor processing time.

## Troubleshooting

### "Playwright not installed"

**Solution:** 
```bash
cd backend
pip install playwright
playwright install chromium
```

### "GPTZero API error: 401 Unauthorized"

**Solution:** Verify API key is correct, check GPTZero dashboard for account status.

### "Humanization timeout after 60 seconds"

**Solutions:**
- Reduce text length (split into chunks <1000 words)
- Retry (free service may be under load)
- Check https://undetectableai.pro manually to verify service is up

### "Could not extract humanized text from page"

**Solutions:**
- Website structure may have changed
- Update CSS selectors in `external_api_service.py`
- Check browser console for JavaScript errors
- Try manual test at https://undetectableai.pro

### High API costs

**GPTZero:**
- Enable result caching
- Use MOCK mode for development
- Optimize workflow to minimize API calls

**UndetectableAI.pro:**
- ✅ **FREE** - No cost concerns!
- But consider processing time in workflow UX

## Example: Complete Essay Workflow

```python
# 1. Create workflow from template
POST /api/v1/workflows/templates/essay-writer
{
    "goal": "Write essay on American Revolution",
    "word_count": 1000,
    "style": "academic"
}

# 2. Execute workflow
POST /api/v1/workflows/{workflow_id}/execute
# Workflow executes: PLAN → DRAFT → VERIFY

# 3. HUMANIZE step (automatic)
# - Sends approved draft to Undetectable AI
# - Polls for completion
# - Returns humanized version for user approval

# 4. INTEGRITY_CHECK step
# - LLM compares original vs humanized
# - Verifies content preservation

# 5. AI_DETECTION step (automatic)
# - Sends to GPTZero
# - Returns detection score
# - No approval needed (informational)

# 6. Final result
# - Humanized essay with low AI detection score
# - Complete audit trail in workflow steps
```

## API Reference

### Health Check Endpoint

```bash
GET /api/v1/health

Response:
{
    "status": "healthy",
    "optillm_connected": true,
    "external_apis": {
        "gptzero": {
            "configured": true,
            "key_present": true,
            "endpoint": "https://api.gptzero.me/v2"
        },
        "undetectable_ai": {
            "configured": true,
            "key_present": true,
            "endpoint": "https://api.undetectable.ai"
        }
    }
}
```

### External API Service

```python
from merlin.services.external_api_service import ExternalAPIService

service = ExternalAPIService()

# AI Detection
result = await service.gptzero_detect(
    text="Essay text here...",
    api_key=None  # Uses config
)

# Humanization
result = await service.undetectable_ai_humanize(
    text="AI-generated text...",
    api_key=None  # Uses config
)

# Health Check
health = await service.check_api_health()
```

## Next Steps

1. **Obtain API keys** from GPTZero and Undetectable AI
2. **Add to .env** file in backend directory
3. **Test workflow** using Essay Writer template
4. **Monitor costs** via provider dashboards
5. **Deploy to production** with environment variables configured

For production deployment guide, see `DEPLOYMENT.md`.
