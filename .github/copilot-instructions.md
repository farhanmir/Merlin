# Merlin AI Workbench - Developer Guide

## Project Vision

Merlin is a **2-pillar BYOK (Bring-Your-Own-Key) AI platform** that supercharges LLMs with advanced inference techniques:

1. **Performance Hub** (✅ Implemented) - Chat interface with OptiLLM optimization techniques
2. **Agentic Workflow Engine** (🚧 Planned) - Visual, multi-step agent for complex tasks like essay writing with user-approval gates

**Current implementation focuses on Pillar 1**. This guide covers implemented patterns and planned architecture.

## Current Architecture (Performance Hub)

3-tier system for optimized LLM chat:
1. **Next.js 15 Frontend** (port 3000) - Server components + Zustand client state
2. **FastAPI Backend** (port 8001) - API key encryption + business logic  
3. **OptiLLM Proxy** (port 8000) - Inference optimization layer

**Critical data flow**: Frontend → Backend (decrypts keys) → OptiLLM (applies techniques) → LLM Provider

## Security-First Pattern: Encrypted Key Storage

API keys are **never stored in plaintext**. All key operations use Fernet (AES-128-CBC):

```python
# backend/src/merlin/core/security.py - encryption wrapper
encrypt_api_key(key, fernet_key) → encrypted_str
decrypt_api_key(encrypted_str, fernet_key) → plaintext_key
```

**Repository pattern** (`backend/src/merlin/repositories/key_repo.py`): All DB operations use `upsert()` to handle insert/update atomically.

**Key validation** (`backend/src/merlin/api/v1/keys.py`): Before storing, test API keys against provider endpoints (OpenAI `/models`, Anthropic `/models`, etc.) via `validate_api_key()`.

## Dependency Injection Pattern

Backend uses FastAPI's `Annotated` dependencies (see `backend/src/merlin/api/deps.py`):

```python
KeyRepoDep = Annotated[ApiKeyRepository, Depends(get_key_repository)]
OptiLLMDep = Annotated[OptiLLMService, Depends(get_optillm_service)]
```

When adding endpoints, inject dependencies via type hints: `async def endpoint(key_repo: KeyRepoDep, optillm: OptiLLMDep)`.

## OptiLLM Technique Integration

Techniques are **model name prefixes**: `"moa-cot_reflection-gpt-4o"` applies Mixture-of-Agents then Chain-of-Thought to GPT-4o.

**Service layer** (`backend/src/merlin/services/optillm_service.py`):
- `_build_model_name()` constructs technique prefix
- Streaming uses `httpx.Timeout(read=None)` for SSE
- Non-streaming has 60s timeout

**Frontend technique panel** (`frontend/src/components/chat/technique-panel.tsx`): Users select techniques, stored in Zustand, sent as array to backend.

## Next.js Route Groups

Frontend uses **route groups** (parentheses don't affect URL):
- `(chat)/` - Chat interface with sidebar layout
- `(settings)/` - Settings pages with different layout

Both inherit from root `layout.tsx` (fonts, metadata). Each group has its own `layout.tsx` for group-specific UI (sidebar, navigation).

## SSE Streaming Implementation

**Backend** (`backend/src/merlin/api/v1/chat.py`):
```python
if request.stream:
    return StreamingResponse(response, media_type="text/event-stream")
```

**Frontend** (`frontend/src/lib/store.ts`):
```typescript
// Buffer incomplete SSE lines, split on \n\n
const parts = buffer.split('\n\n');
buffer = parts.pop() || ''; // Keep incomplete part
```

Handles partial SSE chunks by maintaining a buffer across reads.

## Development Commands

**Initial setup** (PowerShell):
```powershell
# Generate encryption key (required once)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Add to .env as FERNET_KEY

# Backend dev server (hot reload)
cd backend
pip install -e ".[dev]"
fastapi dev src/merlin/main.py --port 8001

# Frontend dev server
cd frontend
npm install
npm run dev

# Run tests
pytest  # backend
npm test  # frontend (when added)
```

**Docker Compose** (production-like):
```powershell
docker-compose up --build
# Requires FERNET_KEY in .env
```

## Testing Patterns

**Fixture-based DB** (`backend/tests/conftest.py`):
- In-memory SQLite via `sqlite+aiosqlite:///:memory:`
- `test_db` fixture creates/tears down schema per test
- Override `get_session` dependency for isolated tests

**Mocking external APIs** (`backend/tests/test_chat.py`):
```python
monkeypatch.setattr("merlin.api.v1.keys.validate_api_key", mock_validate)
```
Patch validation to avoid real API calls in tests.

## State Management

**Zustand store** (`frontend/src/lib/store.ts`) with `persist` middleware:
- `messages`, `selectedModel`, `selectedTechniques` persisted to localStorage
- `sendMessage()` handles SSE streaming, updates assistant message incrementally
- `fetchModels()` syncs available models from backend on mount

## File Naming Conventions

- **Backend**: `snake_case` for files (`optillm_service.py`), classes are `PascalCase`
- **Frontend**: `kebab-case` for components (`chat-interface.tsx`), use `tsx` for React
- **Schemas**: Pydantic models in `schemas/`, mirror API contract (e.g., `chat.py`, `keys.py`)

## Environment Variables

**Backend** (via Pydantic Settings):
- `FERNET_KEY` (required, 44 chars) - validated at startup in `core/config.py`
- `DATABASE_URL` - defaults to `sqlite+aiosqlite:///./merlin.db`
- `OPTILLM_URL` - defaults to `http://localhost:8000`
- `CORS_ORIGINS` - comma-separated or list, defaults to `http://localhost:3000`

**Frontend**:
- `NEXT_PUBLIC_API_URL` - backend URL, defaults to `http://localhost:8001`

## Provider Support

Add new LLM providers in 3 places:
1. `backend/src/merlin/api/v1/keys.py` - Add to `VALIDATION_ENDPOINTS` dict
2. `backend/src/merlin/api/v1/chat.py` - Add models to `PROVIDER_MODELS` dict  
3. Frontend will auto-discover via `/api/v1/chat/models`

**Current model support** (as of Nov 2024):
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1, o1 Mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Google**: Gemini 2.5 Pro/Flash/Flash-Lite (latest), Gemini 2.0 Flash (experimental), Gemini 1.5 Pro/Flash (stable)

## Common Gotchas

- **FERNET_KEY must be exactly 44 characters** - use `Fernet.generate_key()`, not random strings
- **OptiLLM must be running** for chat to work - backend health check depends on it
- **Techniques are order-sensitive** - OptiLLM applies left-to-right (first technique wraps others)
- **SQLAlchemy async sessions** - always `await` queries and use `async with` for transactions
- **Route groups don't create URL segments** - `(chat)/page.tsx` renders at `/`, not `/chat`

---

## Future Architecture: Agentic Workflow Engine (Planned)

The blueprint envisions a **visual, stateful workflow system** (Pillar 2) for multi-step agent tasks. Key architectural considerations:

### Workflow State Machine
- **Step-based execution**: Plan → Draft → Verify → Humanize → Integrity Check → AI Detection
- **User approval gates**: Pause execution at each step, present results, await user action
- **State persistence**: Store workflow progress, allow resume after interruption
- **Branching logic**: Support "Approve & Continue" vs "Edit Manually" paths

### Multi-Model Orchestration
```python
# Conceptual pattern for workflow steps
class WorkflowStep:
    model: str  # Different model per step (e.g., "gpt-4o" for draft, "claude-3-sonnet" for verify)
    technique: list[str]  # OptiLLM techniques (e.g., ["plansearch"] for planning)
    gate_type: GateType  # APPROVAL | DIFF_VIEW | REPORT
```

### External Tool Integration
- **Humanizer APIs**: Third-party services like undetectableai.pro (POST request, diff comparison)
- **AI Detection APIs**: GPTZero, Originality.ai (integrity scoring)
- **Content Verification**: Cross-check humanized text against original for fact preservation

### UI Components (New)
- **Workflow Canvas**: Visual stepper UI (like Stripe checkout) showing current step
- **Diff Viewer**: Side-by-side comparison for humanization changes
- **Verification Reports**: Checklist UI for requirement validation (✓ 500 words, ✓ mentions Stamp Act)
- **Gate Controls**: Action buttons at each step ([Approve & Continue] [Modify] [Revert])

### Database Schema Extensions (Planned)
```python
class Workflow(Base):
    id: int
    user_id: int  # For future multi-user support
    goal: str  # Original user objective
    current_step: str  # "plan" | "draft" | "verify" | etc.
    state: dict  # JSON blob with step outputs
    created_at: datetime

class WorkflowStep(Base):
    id: int
    workflow_id: int
    step_name: str
    input_data: dict
    output_data: dict
    model_used: str
    approved: bool
    completed_at: datetime
```

### Implementation Strategy for Agents

When building the agentic workflow engine:

1. **Start with workflow templates**: Hardcode "Essay Writer" workflow as first template, make system extensible
2. **Reuse OptiLLM integration**: Each step calls `optillm_service.chat_completion()` with step-specific techniques
3. **Add workflow repository**: New `WorkflowRepository` following same pattern as `ApiKeyRepository` (upsert, get_by_id)
4. **WebSocket for real-time updates**: Replace SSE with WebSocket for bidirectional communication (agent pushes updates, user sends approval)
5. **State validation**: Each gate must validate output before allowing progression (e.g., word count check before proceeding from draft)

### Speculative Decoding (Experimental Feature)

**Vision**: "Turbo Mode" using draft model (qwen2.5-0.5b) + target model (gpt-4o) for 2-3x latency reduction.

**Architecture**:
```python
# New service: backend/src/merlin/services/speculative_service.py
class SpeculativeDecodingService:
    async def speculative_completion(
        self,
        draft_model: str,  # Fast, local model via Ollama
        target_model: str,  # Slow, accurate model via OptiLLM
        prompt: str,
        draft_tokens: int = 8,  # Generate 8 tokens speculatively
    ) -> AsyncGenerator[str, None]:
        # 1. Get draft tokens from local model
        draft = await self.ollama_client.generate(draft_model, prompt, max_tokens=draft_tokens)
        
        # 2. Send draft to target model for parallel verification
        verified = await self.optillm_service.verify_tokens(target_model, prompt, draft)
        
        # 3. Stream verified prefix, discard rejected suffix
        yield verified_prefix
```

**UI Addition**: `frontend/src/components/chat/turbo-toggle.tsx` with model pair selector.

**Why it matters**: Demonstrates understanding of inference mechanics, not just API usage. This is SOTA optimization technique.

---

## Implementation Priorities (Vibe-Coded Blueprint)

The full vision prioritizes showcasing **AI Engineering depth**:

1. ✅ **Phase 1**: Performance Hub with OptiLLM (current state)
2. 🚧 **Phase 2**: Agentic Workflow Engine (highest resume value - shows agent design, multi-step orchestration, external tool use)
3. 🔬 **Phase 3**: Speculative Decoding (demonstrates inference optimization mastery)

**Resume value hierarchy**: Workflow Engine > Speculative Decoding > OptiLLM Chat. Prioritize Pillar 2 to differentiate from "ChatGPT clone" projects.
