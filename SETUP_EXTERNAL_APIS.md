# Quick Setup Guide - External APIs

## ✅ What You Need

1. **GPTZero API Key** ($10/month) - For AI detection
2. **Playwright** (FREE) - For text humanization

## 📦 Installation Steps

### Step 1: Install Playwright (FREE Humanization Tool)

```powershell
# Navigate to backend
cd backend

# Install Playwright
pip install playwright

# Download Chromium browser (~200MB)
playwright install chromium
```

**Test installation:**
```powershell
playwright --version
# Should output: Version 1.40.0 (or similar)
```

### Step 2: Get GPTZero API Key (Optional)

1. Go to https://gptzero.me
2. Sign up for an account
3. Navigate to **API** section in dashboard
4. Click **Generate API Key**
5. Copy the key (starts with `gpt_...`)

**Pricing:**
- **Starter**: $10/month for 15,000 words
- **Pro**: $25/month for 50,000 words

### Step 3: Configure Environment

Add to `backend/.env`:

```bash
# GPTZero API Key (for AI detection)
GPTZERO_API_KEY=gpt_your_actual_key_here

# UndetectableAI.pro - No configuration needed! FREE browser automation.
```

### Step 4: Verify Setup

```powershell
# Start backend
cd backend
fastapi dev src/merlin/main.py --port 8001

# In another terminal, check health
curl http://localhost:8001/api/v1/health/detailed
```

**Expected output:**
```json
{
    "external_apis": {
        "gptzero": {
            "configured": true,
            "type": "api_key",
            "endpoint": "https://api.gptzero.me/v2"
        },
        "undetectable_ai_pro": {
            "configured": true,
            "type": "browser_automation",
            "endpoint": "https://undetectableai.pro",
            "free": true,
            "playwright_installed": true
        },
        "status": "ready"
    }
}
```

## 🧪 Test Humanization (FREE)

### Quick Test Script

Create `backend/test_humanization.py`:

```python
import asyncio
from merlin.services.external_api_service import ExternalAPIService

async def test_humanization():
    service = ExternalAPIService()
    
    ai_text = """
    The American Revolution was a significant event in history. 
    It resulted in the independence of the United States. 
    The colonists fought against British rule.
    """
    
    print("🤖 Original AI text:")
    print(ai_text)
    print("\n⏳ Humanizing with UndetectableAI.pro (FREE)...\n")
    
    result = await service.undetectable_ai_humanize(ai_text)
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        print(f"   Details: {result.get('details', '')}")
    else:
        print("✅ Humanization successful!")
        print(f"\n👤 Humanized text:")
        print(result['humanized_text'])
        print(f"\n📊 Word count: {result['word_count']}")

if __name__ == "__main__":
    asyncio.run(test_humanization())
```

Run test:
```powershell
cd backend
python test_humanization.py
```

**Expected output:**
```
🤖 Original AI text:
The American Revolution was a significant event in history...

⏳ Humanizing with UndetectableAI.pro (FREE)...

✅ Humanization successful!

👤 Humanized text:
The American Revolution marked a pivotal moment in our nation's story...

📊 Word count: 42
```

## 🧪 Test AI Detection (Requires API Key)

Create `backend/test_ai_detection.py`:

```python
import asyncio
from merlin.services.external_api_service import ExternalAPIService

async def test_detection():
    service = ExternalAPIService()
    
    # Test with obviously AI-generated text
    ai_text = """
    Artificial intelligence is a rapidly growing field. 
    It has many applications in various industries. 
    Machine learning is a subset of AI that focuses on data analysis.
    """
    
    print("🔍 Analyzing text with GPTZero...\n")
    
    result = await service.gptzero_detect(ai_text)
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print("✅ Detection complete!")
        print(f"\n📊 AI Probability: {result['ai_probability']:.1%}")
        print(f"   Classification: {result['overall_class']}")
        print(f"   Sentences analyzed: {result['sentence_count']}")

if __name__ == "__main__":
    asyncio.run(test_detection())
```

Run test:
```powershell
cd backend
python test_ai_detection.py
```

## 🚀 Using in Workflows

### Create Essay Writer Workflow

```bash
# POST to workflow template endpoint
POST http://localhost:8001/api/v1/workflows/templates/essay-writer
Content-Type: application/json

{
    "goal": "Write a 500-word essay on climate change",
    "word_count": 500,
    "style": "academic"
}
```

### Execute Workflow

```bash
# Execute the created workflow
POST http://localhost:8001/api/v1/workflows/1/execute
```

**Workflow Steps:**
1. **PLAN** - GPT-4o with plansearch creates outline → **Approve**
2. **DRAFT** - Claude 3.5 writes full essay → **Approve**
3. **VERIFY** - GPT-4o checks requirements → **Approve**
4. **HUMANIZE** - UndetectableAI.pro (FREE!) → **Approve**
5. **INTEGRITY_CHECK** - GPT-4o compares original vs humanized → **Approve**
6. **AI_DETECTION** - GPTZero scores final essay → **Auto-complete**

## 💰 Cost Breakdown

| Service | Type | Cost | Usage |
|---------|------|------|-------|
| **UndetectableAI.pro** | Browser Automation | **$0 FREE** | Unlimited |
| **Playwright** | Local Software | **$0 FREE** | One-time install |
| **GPTZero** | API (Optional) | $10/month | 15,000 words |
| **LLM APIs** | User's Keys | User's cost | Via OptiLLM |

**Total Monthly Cost: $10** (just GPTZero, everything else FREE!)

## 🔧 Troubleshooting

### "Playwright not installed"

```powershell
pip install playwright
playwright install chromium
```

### "Chromium not found"

```powershell
# Reinstall Chromium browser
playwright install --with-deps chromium
```

### "Timeout after 60 seconds"

- Text too long (>1000 words) - split into chunks
- Service under load - retry in a few minutes
- Check https://undetectableai.pro is accessible

### "GPTZero API error: 401"

- Check API key in `.env` is correct
- Verify account is active on https://gptzero.me
- Check quota hasn't been exceeded

## 📚 Next Steps

1. ✅ Install Playwright and Chromium
2. ✅ (Optional) Get GPTZero API key
3. ✅ Add `GPTZERO_API_KEY` to `.env`
4. ✅ Run test scripts to verify setup
5. ✅ Create Essay Writer workflow
6. ✅ Execute end-to-end workflow

**Result:** Complete agentic essay writing system with FREE humanization! 🎉

For deployment to production, see `DEPLOYMENT.md`.
