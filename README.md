# Merlin - Agentic AI Workbench

A **2-pillar BYOK (Bring-Your-Own-Key) AI platform** that supercharges LLMs with advanced inference techniques and agentic workflows.

## 🎯 What is Merlin?

Merlin is a production-ready AI workbench with:

1. **Performance Hub** - Chat interface with integrated OptiLLM optimization (10+ techniques)
2. **Agentic Workflow Engine** - Multi-step workflows with approval gates and external tool integration

**Key Differentiator**: Not another ChatGPT clone. Merlin demonstrates advanced AI engineering with workflow orchestration, external API integration, and inference optimization directly integrated into the backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MERLIN AI WORKBENCH                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Pillar 1: Performance Hub                                       │
│  ├─ Next.js 15 Frontend (SSE streaming, session management)     │
│  ├─ FastAPI Backend (encrypted keys, chat API, rate limiting)   │
│  └─ Integrated OptiLLM (inference optimization, direct calls)   │
│                                                                   │
│  Pillar 2: Agentic Workflow Engine                              │
│  ├─ Workflow Orchestrator (6 step types, approval gates)        │
│  ├─ External APIs (GPTZero, Undetectable AI)                    │
│  └─ Essay Writer Template (plan → draft → humanize → detect)    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Zustand
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Cryptography (Fernet), slowapi (rate limiting)
- **AI Inference**: OptiLLM (integrated, direct function calls - no proxy server)
- **External APIs**: GPTZero (AI detection), Undetectable AI (humanization)
- **Database**: SQLite (upgradable to PostgreSQL for production)
- **Infrastructure**: Docker, Docker Compose, Render (free tier), Vercel

## Features

### Performance Hub (Chat Interface)
- 🔐 **BYOK Management**: Securely store API keys for OpenAI, Anthropic, Google with Fernet encryption
- 💬 **Multi-Model Chat**: Real-time streaming with GPT-4o, Claude 3.5, Gemini 2.5
- ⚡ **OptiLLM Techniques**: Directly integrated (MOA, CoT Reflection, PlanSearch, etc.)
- 💾 **Chat Sessions**: Organize conversations, auto-save, load history
- 🎨 **Landing Page**: DeepSeek-inspired marketing homepage with product showcase
- ⏱️ **Rate Limiting**: 30 requests/hour per user (aligned with Neon Free Tier)
- 🔄 **Retry Mechanism**: Inline retry button for failed messages
- ⚙️ **Server Wake Detection**: Handles Render cold starts gracefully (60s timeout)

### Agentic Workflow Engine
- 🤖 **6 Step Types**: PLAN, DRAFT, VERIFY, HUMANIZE, INTEGRITY_CHECK, AI_DETECTION
- ✅ **Approval Gates**: Pause at each step for user review
- 🔄 **State Persistence**: Resume workflows after interruption
- 🎯 **Multi-Model Orchestration**: Different models per step
- 🛠️ **External Tool Integration**: GPTZero for AI detection, Undetectable AI for humanization
- 📝 **Essay Writer Template**: Complete 6-step workflow ready to use

### Production-Ready
- 🔒 **Fernet Encryption**: AES-128-CBC for API keys at rest
- 🌐 **CORS Protection**: Configurable allowed origins
- 📊 **Rate Limiting**: Per-user rate limits with slowapi
- 🧪 **Comprehensive Testing**: Backend tests with pytest, fixtures, mocking
- 📦 **Docker Support**: Multi-container setup with docker-compose
- 🚀 **Free Tier Optimized**: Deployed on Render free tier with cost-conscious limits

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Docker and Docker Compose (optional)
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd merlin
```
### 2. Configure environment variables

```bash
# Copy the example environment file
cp .env.example .env

# Generate a Fernet key for encryption
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Edit .env and add your generated FERNET_KEY
```

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8001

### 4. Development Setup (without Docker)

**Backend (with integrated OptiLLM):**
```bash
cd backend
pip install -e .
fastapi dev src/merlin/main.py --port 8001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Note: OptiLLM is now directly integrated into the FastAPI backend - no separate proxy server needed!

## Project Structure

```
merlin/
├── frontend/               # Next.js 15 application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── (chat)/    # Chat interface
│   │   │   ├── (settings)/ # Settings pages
│   │   │   └── page.tsx   # Landing page
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and state
│   └── package.json
├── backend/               # FastAPI application
│   ├── src/merlin/
│   │   ├── api/          # API routes
│   │   ├── core/         # Config and security
│   │   ├── db/           # Database models
│   │   ├── optillm/      # Integrated OptiLLM techniques
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic (including OptiLLMService)
│   │   └── main.py       # FastAPI app entry
│   │   └── schemas/      # Pydantic models
│   └── pyproject.toml
├── docker-compose.yml     # Orchestration
└── README.md
```

## Security Notes

- API keys are encrypted at rest using Fernet (AES-128-CBC + HMAC-SHA256)
- Encryption key (`FERNET_KEY`) must be securely generated and stored
- Never commit `.env` files or expose the `FERNET_KEY`
- Keys are validated before storage by making test API calls
- Database file (`merlin.db`) contains encrypted keys - protect it accordingly

## Development Workflow

1. **Frontend Development**: `cd frontend && npm run dev` (hot reload on http://localhost:3000)
2. **Backend Development**: `cd backend && fastapi dev src/merlin/main.py` (hot reload on http://localhost:8001)
3. **Type Checking**: `npm run type-check` (frontend), `mypy src` (backend)
4. **Linting**: `npm run lint` (frontend), `ruff check src` (backend)
5. **Testing**: `npm test` (frontend), `pytest` (backend)

## OptiLLM Techniques

## OptiLLM Techniques

Merlin supports 20+ optimization techniques via OptiLLM:

- **PlanSearch**: Complex problem-solving with planning
- **CoT-Reflection**: Chain-of-thought with self-reflection
- **Mixture of Agents (MoA)**: Multi-agent collaboration
- **Self-Consistency**: Sample multiple reasoning paths
- **LEAP**: Learning to reason via latent exploration
- **R-STAR**: Recursive self-training for reasoning

Enable techniques in the chat interface (Advanced Settings panel) to optimize inference quality and cost.

## Workflow Example: Essay Writer

```bash
# 1. Create workflow from template
POST /api/v1/workflows/templates/essay-writer
{
    "goal": "Write a 1000-word essay on the American Revolution",
    "word_count": 1000,
    "style": "academic"
}

# 2. Execute workflow (6 steps with approval gates)
POST /api/v1/workflows/{workflow_id}/execute

# Steps execute sequentially:
# → PLAN: Create outline (plansearch technique)
# → DRAFT: Write full essay (Claude, cot_reflection)
# → VERIFY: Check requirements (GPT-4o)
# → HUMANIZE: Undetectable AI humanization
# → INTEGRITY_CHECK: Verify content preservation
# → AI_DETECTION: GPTZero detection score

# 3. Approve each step
POST /api/v1/workflows/{workflow_id}/steps/{step_index}/approve
{"approved": true, "feedback": "Looks great!"}
```

## Documentation

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Free deployment options (Render, Railway, Vercel)
- **[EXTERNAL_APIS.md](./EXTERNAL_APIS.md)** - GPTZero and Undetectable AI integration
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete feature overview

## External API Integration

Merlin integrates with:

- **GPTZero** - AI text detection for AI_DETECTION workflow steps
- **Undetectable AI** - Text humanization for HUMANIZE workflow steps

See `EXTERNAL_APIS.md` for setup instructions and API details.

## Future Roadmap

- [x] ~~Agentic Workflow Engine~~ ✅ Complete
- [x] ~~External API Integration~~ ✅ Complete
- [x] ~~Essay Writer Template~~ ✅ Complete
- [ ] Workflow Frontend UI (visual stepper, diff viewer)
- [ ] Speculative Decoding for 2-3x faster inference
- [ ] Multi-user support with authentication
- [ ] PostgreSQL migration for production
- [ ] Rate limiting and cost tracking
- [ ] Custom workflow templates (user-created)

## License

MIT

## Contributing

Contributions are welcome! Please:

1. Follow code style (Black for Python, Prettier for TypeScript)
3. Add tests for new features
4. Open an issue or submit a pull request

## Support

- **Documentation**: See docs in repository
- **API Reference**: http://localhost:8001/docs (FastAPI auto-docs)
- **Issues**: GitHub Issues for bugs/features

---

**Built to showcase AI Engineering depth beyond simple ChatGPT clones.**
