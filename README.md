# PM Copilot

PM Copilot is a web-first, agentic assistant that helps product managers turn messy product inputs, such as interviews, notes, brainstorms, and rough ideas, into structured insights, prioritization decisions, and PRD-style product artifacts.

## Overview

PM Copilot is organized around four agents:

* **Intake Agent:** structures raw notes into product context, pain points, opportunities, and open questions.
* **Synthesis Agent:** identifies themes, user needs, insights, and feature opportunities.
* **Prioritization Agent:** ranks opportunities, features, or product ideas based on impact, value, effort, complexity, risk, and evidence strength.
* **Spec Writer Agent:** generates editable PRD-style drafts with goals, requirements, success metrics, risks, and next steps.

Agents can be used individually or as a full pipeline from raw notes to PRD generation.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Check active LLM mode:

```text
GET /api/health
```

Example response:

```json
{ "provider": "mock", "model": "gpt-4o-mini" }
```

## LLM Providers

| Variable          | Meaning                             | Default                     |
| ----------------- | ----------------------------------- | --------------------------- |
| `LLM_PROVIDER`    | `mock` no key, or `openai`          | `mock`                      |
| `OPENAI_API_KEY`  | Required when provider is `openai`  | —                           |
| `OPENAI_MODEL`    | Chat model for all agents           | `gpt-4o-mini`               |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible API base | `https://api.openai.com/v1` |

Mock mode is the default and does not require an API key.

For OpenAI mode, add this to `.env.local`:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
```

Restart `npm run dev` after changing environment variables. API keys are server-only and should never use `NEXT_PUBLIC_*`.

Cost note: `POST /api/pipeline` runs four sequential model calls, so single-agent routes are better for development.

## Usage

1. Paste product notes, interviews, feedback, or rough ideas into the Intake Agent.
2. Use the Synthesis Agent to extract themes, insights, and opportunities.
3. Use the Prioritization Agent to rank opportunities, features, or product ideas.
4. Use the Spec Writer Agent to generate and refine a PRD.
5. Download the generated PRD as a PDF if needed.

Agents accept optional upstream JSON, such as `intakeOutput` or `synthesisOutput`, for pipeline mode. They can also run standalone with `rawInput`, `directInput`, or `notes`.

## API Routes

| Route                      | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `POST /api/intake`         | Intake Agent                                                  |
| `POST /api/synthesis`      | Synthesis Agent                                               |
| `POST /api/prioritization` | Prioritization Agent                                          |
| `POST /api/spec-writer`    | Spec Writer Agent                                             |
| `POST /api/pipeline`       | Full chain from Intake to Synthesis to Prioritization to Spec |
| `GET /api/health`          | Provider label, no secrets                                    |

## Architecture

| Area                         | Details                                 |
| ---------------------------- | --------------------------------------- |
| `lib/llm/llmClient.ts`       | Provider factory, `mock` or `openai`    |
| `lib/llm/openaiLLMClient.ts` | OpenAI Chat Completions client          |
| `lib/llm/mockLLMClient.ts`   | Deterministic mock provider             |
| `lib/agents/*`               | Agent runners                           |
| `lib/prompts.ts`             | System prompts and user prompt builders |
| `lib/schemas.ts`             | Shared types and JSON coercers          |

## AI Usage Disclosure

This project uses an existing LLM through an API layer. It does not train a new model from scratch. AI is used to structure product notes, synthesize insights, prioritize ideas, and generate PRD-style drafts. Outputs should be reviewed by a human before being used for real product decisions.

## Testing

* With no environment variables, the dashboard runs in mock mode.
* `LLM_PROVIDER=openai` without `OPENAI_API_KEY` returns a clear configuration error.
* A valid OpenAI key enables real completions for individual agents and the full pipeline.
* `POST /api/pipeline` runs four sequential completions when OpenAI mode is enabled.

## Citations / Acknowledgements

Built with Next.js, React, TypeScript, Tailwind CSS, and the OpenAI API. Visual inspiration came from modern dark product interfaces such as Linear and Ycode.
