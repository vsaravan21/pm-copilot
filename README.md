# PM Copilot

PM Copilot is a web-first, agentic assistant that helps PMs squeeze structure out of unstructured inputs — interviews, notes, brainstorms — through Intake, Synthesis, Prioritization, and Spec Writer agents.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: configure OpenAI
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Check active LLM mode: `GET /api/health` → `{ "provider": "mock" | "openai", "model"?: "..." }`.

## LLM providers

| Variable | Meaning | Default |
| -------- | ------- | ------- |
| `LLM_PROVIDER` | `mock` (no key) or `openai` | `mock` |
| `OPENAI_API_KEY` | Required when provider is `openai` | — |
| `OPENAI_MODEL` | Chat model for all agents | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible API base | `https://api.openai.com/v1` |

**Mock mode (default)** — deterministic heuristics, no API key.

**OpenAI mode** — add to `.env.local`:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
```

Restart `npm run dev` after changing env vars. Keys are server-only (never `NEXT_PUBLIC_*`).

**Cost note:** `POST /api/pipeline` runs four sequential model calls. Prefer single-agent routes during development.

## API routes

| Route | Purpose |
| ----- | ------- |
| `POST /api/intake` | Intake Agent |
| `POST /api/synthesis` | Synthesis Agent |
| `POST /api/prioritization` | Prioritization Agent |
| `POST /api/spec-writer` | Spec Writer Agent |
| `POST /api/pipeline` | Full chain (Intake → Synthesis → Prioritization → Spec) |
| `GET /api/health` | Provider label (no secrets) |

Agents accept optional upstream JSON (`intakeOutput`, `synthesisOutput`, etc.) for pipeline mode, or standalone `rawInput` / `directInput` / `notes` alone.

## Architecture

| Area | Details |
| ---- | ------- |
| `lib/llm/llmClient.ts` | Provider factory (`mock` \| `openai`) |
| `lib/llm/openaiLLMClient.ts` | OpenAI Chat Completions (fetch, JSON mode) |
| `lib/llm/mockLLMClient.ts` | Deterministic mock |
| `lib/agents/*` | Agent runners (unchanged contract: `llm.complete`) |
| `lib/prompts.ts` | System prompts + user prompt builders |
| `lib/schemas.ts` | Shared types + JSON coercers |

## Testing

1. With no env vars — Intake on dashboard uses mock.
2. `LLM_PROVIDER=openai` without `OPENAI_API_KEY` — API returns a clear config error (400).
3. Valid OpenAI key — `POST /api/intake` returns structured JSON.
4. `POST /api/pipeline` with a short note — four real completions when OpenAI is enabled.
