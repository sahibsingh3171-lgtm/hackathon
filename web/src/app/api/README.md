# `api/` — Next.js server Route Handlers

Each `*/route.ts` file is a **small HTTP endpoint** served by the same Next.js process as the UI.

- Runs on the **server** only; safe for **`OPENAI_API_KEY`** and other secrets (`src/lib/env.ts`).
- Typical pattern: `POST` JSON in → call OpenAI or other services → JSON out.
- **Not** a separate microservice repo — colocated backend for the hackathon app.

Product endpoints for Clarity live under **`clarity/`** — see that folder’s `README.md`.

Full map: [`../../../docs/CODEMAP.md`](../../../docs/CODEMAP.md).
