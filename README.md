# PM Copilot

PM Copilot is a web-first, agentic assistant that helps PMs squeeze structure out of unstructured inputs — interviews, notes, brainstorms — before scaling into fuller synthesis or spec writing.

This repo currently ships **Iteration 01**: a single lane that runs an **Intake Agent** backed by mock LLM semantics (no keys required).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## MVP surface area

| Area                                                                 | Details                                                    |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `app/page.tsx`                                                       | Client orchestration connecting input + visualization      |
| `app/api/intake/route.ts`                                            | POST `{ notes, productName?, targetUser? } → JSON intake` |
| `lib/agents/intakeAgent.ts`                                          | Agent runner + parsing guardrails                         |
| `lib/llm/llmClient.ts`                                               | Provider factory — extend with OpenAI / Workers AI        |
| `lib/llm/mockLLMClient.ts`                                           | Deterministic heuristics with `LLMClient.complete` façade   |

Future lanes (`synthesisAgent`, `prioritizationAgent`, `specWriterAgent`) are scaffolded placeholders under `lib/agents/`.

### Environment

| Variable         | Meaning                                       | Default    |
| ---------------- | --------------------------------------------- | ---------- |
| `LLM_PROVIDER`   | `'mock'` (built-in), future `openai`, etc. | `mock`     |

Selecting an unimplemented provider throws with guidance on wiring a real backend.

### Extending providers

1. Implement `LLMClient` in `lib/llm/` (mirror `mockLLMClient.ts`).
2. Register it inside `createDefaultLLMClient()`.
3. Keep `runIntakeAgent()` unchanged — it relies only on `.complete(...)`.

Prompt text & JSON discipline live in `lib/prompts.ts` alongside shared schema typing in `lib/schemas.ts`.

## Testing ideas

1. Paste a multi-bullet interview excerpt — confirm classifications + grounded bullets.
2. Provide optional product/target fields — observe missing-context questions narrowing.
3. Flip `LLM_PROVIDER` to verify helpful errors until a real backend exists.
